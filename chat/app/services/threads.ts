import {IGunChain, IGunOnEvent} from 'gun';

import {ThreadNode, Thread, MessageNode} from '../types/thread';

import {debounce, once} from '../helpers/common';
import {HashEncoding, hash} from '../helpers/crypto';
import {
  GUN,
  GunResult,
  StreamContext,
  StreamCallback,
  StreamOptions,
  Streamer,
  createStreamer,
  putValue,
  setValue,
  promisifyStream,
  StreamContextItem,
} from '../helpers/gun';

import {AuthService} from './auth';
import {UsersService} from './users';
import {FriendsService} from './friends';

export class ThreadsService {
  readonly TOP_NODE_NAME = 'threads';

  get userThreadsChain() {
    return this.authService.userChain.get(
      this.TOP_NODE_NAME
    ) as unknown as IGunChain<any>;
  }

  constructor(
    public readonly authService: AuthService,
    public readonly usersService: UsersService,
    public readonly friendsService: FriendsService
  ) {
    (globalThis as any).threadsService = this; // for debugging
  }

  getIndexChain(userIdHash: string) {
    return GUN.get(`#${this.TOP_NODE_NAME}-${userIdHash}`);
  }

  async calculateThreadId(userId: string) {
    return await hash(`${this.TOP_NODE_NAME}${userId}`, HashEncoding.Hex);
  }

  async buildMessage(friendEpub: string, rawContent: string) {
    const result: MessageNode = {
      content$$: await this.authService.encryptData(rawContent, friendEpub),
      createdAt: new Date().toISOString(),
    };
    return result;
  }

  private async createIndex(sourceUserId: string, destUserId: string) {
    const value = destUserId;
    const key = await hash(value);
    if (!key) throw new Error('Create thread index failed!');
    try {
      const chain = this.getIndexChain(await hash(sourceUserId));
      await setValue(chain, key, value);
    } catch (error) {
      // exists
    }
  }

  async extractNodeData(threadNode: GunResult<ThreadNode>, key: string) {
    if (!threadNode) return null;
    const friend = await promisifyStream(
      this.friendsService.streamByFriendId.bind(this.friendsService),
      threadNode.friendId
    );
    if (!friend) return null;
    const {createdAt, latestContent$$, latestAt, latestMine} = threadNode;
    // decrypt latest content
    let latestContent = '';
    if (latestContent$$) {
      try {
        latestContent = await this.authService.decryptData(
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
      this.friendsService.streamByUserId.bind(this.friendsService),
      userId
    );
    const friend =
      currentFriend || (await this.friendsService.addFriend(userId));
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
    const streamer = createStreamer(callback, options);
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
    const streamer = createStreamer(callback, options);
    const chain = this.getIndexChain(await hash(this.authService.userId)).get(
      await hash(userId)
    );
    const indexHandler = this.createIndexHandler(streamer);
    // start stream
    chain.on(indexHandler);
  }

  async streamList(
    callback: StreamCallback<Thread | null>,
    options?: StreamOptions
  ) {
    const streamer = createStreamer(callback, options);
    const chain = this.getIndexChain(await hash(this.authService.userId));
    const indexHandler = this.createIndexHandler(streamer, true);
    // start stream
    chain.map().on(indexHandler);
  }

  private createThreadStreamHandler(
    streamer: Streamer<any>,
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
        (context ||= new Map<string, StreamContextItem>()).set(key, {
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

  private createIndexHandler(streamer: Streamer<any>, noDebounce = false) {
    const handler = once(
      async (
        targetUserId: GunResult<string>,
        key: string,
        message: any,
        event: IGunOnEvent,
        context?: StreamContext
      ) => {
        (context ||= new Map<string, StreamContextItem>()).set(key, {
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
    streamer: Streamer<any>,
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
        (context ||= new Map<string, StreamContextItem>()).set(key, {
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

export default ThreadsService;
