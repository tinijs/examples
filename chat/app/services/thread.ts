import {IGunChain, IGunOnEvent} from 'gun';

import {debounce, once} from '@tinijs/toolbox/common';
import {HashEncoding, sha256} from '@tinijs/toolbox/crypto';
import {
  AuthService,
  UserService,
  GunResult,
  StreamContext,
  StreamCallback,
  StreamOptions,
  Stream,
  createStream,
  putValue,
  setValue,
  promisifyStream,
  StreamContextEntry,
} from '@tinijs/toolbox/gun';

import {ThreadNode, Thread, MessageNode} from '../types/thread';

import {GUN} from '../consts/gun';

import {FriendService} from './friend';

export class ThreadService {
  readonly TOP_NODE_NAME = 'threads';

  get userThreadsChain() {
    return this.authService.userChain.get(
      this.TOP_NODE_NAME
    ) as unknown as IGunChain<any>;
  }

  constructor(
    public readonly authService: AuthService,
    public readonly userService: UserService,
    public readonly friendService: FriendService
  ) {
    (globalThis as any).threadService = this; // for debugging
  }

  getIndexChain(userIdHash: string) {
    return GUN.get(`#${this.TOP_NODE_NAME}-${userIdHash}`);
  }

  async calculateThreadId(userId: string) {
    return await sha256(`${this.TOP_NODE_NAME}${userId}`, HashEncoding.Hex);
  }

  async buildMessage(friendEpub: string, rawContent: string) {
    const result: MessageNode = {
      content$$: await this.authService.encrypt(rawContent, friendEpub),
      createdAt: new Date().toISOString(),
    };
    return result;
  }

  private async createIndex(sourceUserId: string, destUserId: string) {
    const value = destUserId;
    const key = await sha256(value);
    if (!key) throw new Error('Create thread index failed!');
    try {
      const chain = this.getIndexChain(await sha256(sourceUserId));
      await setValue(chain, key, value);
    } catch (error) {
      // exists
    }
  }

  async extractNodeData(threadNode: GunResult<ThreadNode>, key: string) {
    if (!threadNode) return null;
    const friend = await promisifyStream(
      this.friendService.streamByFriendId.bind(this.friendService),
      threadNode.friendId
    );
    if (!friend) return null;
    const {createdAt, latestContent$$, latestAt, latestMine} = threadNode;
    // decrypt latest content
    let latestContent = '';
    if (latestContent$$) {
      try {
        latestContent = await this.authService.decrypt(
          latestContent$$,
          friend.profile.epub
        );
      } catch (error) {}
    }
    // result
    const thread: Thread = {
      id: key,
      friend,
      createdAt: createdAt,
      latestContent,
      latestAt: latestAt || new Date().toISOString(),
      latestMine,
    };
    return thread;
  }

  async createThread(userId: string, firstMessage?: string) {
    const currentFriend = await promisifyStream(
      this.friendService.streamByUserId.bind(this.friendService),
      userId
    );
    const friend =
      currentFriend || (await this.friendService.addFriend(userId));
    // build thread
    const threadId = await this.calculateThreadId(friend.profile.id);
    const message = !firstMessage
      ? undefined
      : await this.buildMessage(friend.profile.epub, firstMessage);
    const thread: ThreadNode = {
      friendId: friend.id,
      createdAt: new Date().toISOString(),
      latestContent$$: !message ? '' : message.content$$,
      latestAt: !message ? '' : message?.createdAt,
      latestMine: true,
    };
    // add thread and indexes
    await putValue(this.userThreadsChain.get(threadId), thread);
    await this.createIndex(this.authService.userId, friend.profile.id);
    await this.createIndex(friend.profile.id, this.authService.userId);
    // return the new thread id
    return threadId;
  }

  streamByThreadId(
    threadId: string,
    callback: StreamCallback<Thread | null>,
    options?: StreamOptions
  ) {
    const streamer = createStream(callback, options);
    const chain = this.userThreadsChain.get(threadId);
    const threadHandler = this.createThreadStreamHandler(streamer);
    // start stream
    chain.on(threadHandler);
  }

  async streamByUserId(
    userId: string,
    callback: StreamCallback<Thread | null>,
    options?: StreamOptions
  ) {
    const streamer = createStream(callback, options);
    const chain = this.getIndexChain(await sha256(this.authService.userId)).get(
      await sha256(userId)
    );
    const indexHandler = this.createIndexHandler(streamer);
    // start stream
    chain.on(indexHandler);
  }

  async streamList(
    callback: StreamCallback<Thread | null>,
    options?: StreamOptions
  ) {
    const streamer = createStream(callback, options);
    const chain = this.getIndexChain(await sha256(this.authService.userId));
    const indexHandler = this.createIndexHandler(streamer, true);
    // start stream
    chain.map().on(indexHandler);
  }

  private createThreadStreamHandler(streamer: Stream<any>, noDebounce = false) {
    const handler = once(
      async (
        threadNode: GunResult<ThreadNode>,
        key: string,
        message: any,
        event: IGunOnEvent,
        context?: StreamContext
      ) => {
        (context ||= new Map<string, StreamContextEntry>()).set(key, {
          raw: threadNode,
          message,
          event,
        });
        // process thread node
        const thread = !threadNode
          ? null
          : await this.extractNodeData(threadNode, key);
        // result
        return streamer.emitValue(thread, context);
      }
    );
    return noDebounce ? handler : debounce(handler);
  }

  private createIndexHandler(streamer: Stream<any>, noDebounce = false) {
    const handler = once(
      async (
        targetUserId: GunResult<string>,
        key: string,
        message: any,
        event: IGunOnEvent,
        context?: StreamContext
      ) => {
        (context ||= new Map<string, StreamContextEntry>()).set(key, {
          raw: targetUserId,
          message,
          event,
        });
        if (!targetUserId) return streamer.emitValue(null, context);
        const threadId = await this.calculateThreadId(targetUserId);
        const threadHandler = this.createThreadStreamHandlerOrCreateNewThread(
          targetUserId,
          streamer
        );
        return this.userThreadsChain
          .get(threadId)
          .on((...params) => threadHandler(...params, context));
      }
    );
    // result
    return noDebounce ? handler : debounce(handler);
  }

  private createThreadStreamHandlerOrCreateNewThread(
    userId: string,
    streamer: Stream<any>,
    noDebounce = false
  ) {
    const handler = once(
      async (
        threadNode: GunResult<ThreadNode>,
        key: string,
        message: any,
        event: IGunOnEvent,
        context?: StreamContext
      ) => {
        (context ||= new Map<string, StreamContextEntry>()).set(key, {
          raw: threadNode,
          message,
          event,
        });
        // process thread node
        const thread = !threadNode
          ? null
          : await this.extractNodeData(threadNode, key);
        if (!thread) {
          const newTheadId = await this.createThread(userId);
          const debounceHandler = debounce(handler);
          return this.userThreadsChain
            .get(newTheadId)
            .on((...params) => debounceHandler(...params, context));
        }
        // result
        return streamer.emitValue(thread, context);
      }
    );
    return noDebounce ? handler : debounce(handler);
  }
}

export default ThreadService;
