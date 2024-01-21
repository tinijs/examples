import {IGunChain, IGunOnEvent} from 'gun';

import {Friend} from '../types/user';
import {MessageNode, Message} from '../types/thread';

import {
  GUN,
  GunResult,
  StreamCallback,
  StreamOptions,
  putValue,
  setValues,
  extractKeys,
  createStreamer,
  promisifyStream,
  StreamContextItem,
} from '../helpers/gun';

import {AuthService} from './auth';
import {UsersService} from './users';
import {FriendsService} from './friends';
import {ThreadsService} from './threads';

export class MessagesService {
  readonly TOP_NODE_NAME = 'messages';

  get userMessagesChain() {
    return this.authService.userChain.get(
      this.TOP_NODE_NAME
    ) as unknown as IGunChain<any>;
  }

  constructor(
    public readonly authService: AuthService,
    public readonly usersService: UsersService,
    public readonly friendsService: FriendsService,
    public readonly threadsService: ThreadsService
  ) {
    (globalThis as any).messagesService = this; // for debugging
  }

  async getFriendByUserIdOrThrow(userId: string) {
    const friend = await promisifyStream(
      this.friendsService.streamByUserId.bind(this.friendsService),
      userId
    );
    if (!friend) throw new Error('Friend not found!');
    return friend;
  }

  async extractNodeData(
    friend: Friend,
    messageNode: GunResult<MessageNode>,
    key: string
  ) {
    if (!messageNode) return null;
    const {content$$, createdAt} = messageNode;
    let decryptedContent: string | undefined;
    try {
      decryptedContent = await this.authService.decryptData(
        content$$,
        friend.profile.epub
      );
    } catch (error) {
      return null;
    }
    const message: Message = {
      id: key,
      content: String(decryptedContent),
      createdAt,
    };
    return message;
  }

  async sendMessage(userId: string, messageId: string, rawMessage: string) {
    const friend = await this.getFriendByUserIdOrThrow(userId);
    const threadId = await this.threadsService.calculateThreadId(
      friend.profile.id
    );
    const message = await this.threadsService.buildMessage(
      friend.profile.epub,
      rawMessage
    );
    // add message and update thread
    await putValue(
      this.userMessagesChain.get(threadId).get(messageId),
      message
    );
    await setValues(this.threadsService.userThreadsChain.get(threadId), {
      latestAt: message.createdAt,
      latestContent$$: message.content$$,
    });
    // return newly added message
    return this.extractNodeData(friend, message, messageId) as Promise<Message>;
  }

  async getAndStreamUserMessages(
    userId: string,
    streamingCallback: (message: Message, evt: any) => void
  ) {
    const friend = await this.getFriendByUserIdOrThrow(userId);
    const threadId = await this.threadsService.calculateThreadId(
      friend.profile.id
    );
    return await this.getAndStreamMessages(
      friend,
      this.userMessagesChain.get(threadId),
      streamingCallback
    );
  }

  async getAndStreamFriendMessages(
    userId: string,
    streamingCallback: (message: Message, evt: any) => void
  ) {
    const friend = await this.getFriendByUserIdOrThrow(userId);
    const threadId = await this.threadsService.calculateThreadId(
      this.authService.userId
    );
    return await this.getAndStreamMessages(
      friend,
      GUN.user(friend.profile.pub).get(this.TOP_NODE_NAME).get(threadId),
      streamingCallback
    );
  }

  private async getAndStreamMessages(
    friend: Friend,
    chain: IGunChain<any>,
    streamingCallback: (message: Message, evt: any) => void
  ) {
    // load current messages
    const currentMessages = await new Promise<Message[]>(resolve => {
      const items: Message[] = [];
      chain.once((record: any) => {
        if (!record) return resolve(items);
        const allKeys = extractKeys(record);
        const allCount = allKeys.length;
        let processedCount = 0;
        allKeys.forEach(key => {
          chain.get(key).once(async (data, key) => {
            const item = await this.extractNodeData(friend, data, key);
            if (item) items.push(item);
            if (++processedCount >= allCount) resolve(items);
          });
        });
      });
    });
    // stream new messages
    const loadedMessagesRecord = new Set(
      currentMessages.map(message => message.id)
    );
    chain
      .map()
      .on(async (messageNode: MessageNode, key: string, _: any, evt: any) => {
        if (!loadedMessagesRecord.has(key)) {
          loadedMessagesRecord.add(key);
          const message = await this.extractNodeData(friend, messageNode, key);
          if (message) streamingCallback(message, evt);
        }
      });
    // return current messages
    return currentMessages;
  }

  async streamUserMessages(
    userId: string,
    callback: StreamCallback<Message | null>,
    options?: StreamOptions
  ) {
    const friend = await this.getFriendByUserIdOrThrow(userId);
    const threadId = await this.threadsService.calculateThreadId(
      friend.profile.id
    );
    return this.streamMessages(
      friend,
      this.userMessagesChain.get(threadId),
      callback,
      options
    );
  }

  async streamFriendMessages(
    userId: string,
    callback: StreamCallback<Message | null>,
    options?: StreamOptions
  ) {
    const friend = await this.getFriendByUserIdOrThrow(userId);
    const threadId = await this.threadsService.calculateThreadId(
      this.authService.userId
    );
    return this.streamMessages(
      friend,
      GUN.user(friend.profile.pub).get(this.TOP_NODE_NAME).get(threadId),
      callback,
      options
    );
  }

  private streamMessages(
    friend: Friend,
    chain: IGunChain<any>,
    callback: StreamCallback<Message | null>,
    options?: StreamOptions
  ) {
    const streamer = createStreamer(callback, options);
    // list handler
    const listHandler = async (
      messageNode: GunResult<MessageNode>,
      key: string,
      msg: any,
      event: IGunOnEvent
    ) => {
      if (!messageNode) return;
      const context = new Map<string, StreamContextItem>([
        [key, {raw: messageNode, message: msg, event}],
      ]);
      // process message node
      const message = await this.extractNodeData(friend, messageNode, key);
      // result
      return streamer.emitValue(message, context);
    };
    // start stream
    chain.map().on(listHandler);
  }
}

export default MessagesService;
