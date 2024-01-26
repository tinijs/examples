import {IGunChain, IGunOnEvent} from 'gun';

import {debounce, deduplicateCallback} from '@tinijs/toolbox/common';
import {HashEncoding, sha256} from '@tinijs/toolbox/crypto';
import {
  AuthService,
  UserService,
  GunResult,
  StreamContext,
  StreamCallback,
  StreamOptions,
  putValue,
  createStream,
  StreamContextEntry,
  Stream,
  GunLink,
  extractKeys,
} from '@tinijs/toolbox/gun';

import {FriendNode, Friend} from '../types/friend';

export class FriendService {
  private readonly ERRORS = {
    USER_NOT_FOUND: new Error('User not found'),
    FRIEND_EXISTS: new Error('Friend already exists'),
  };

  readonly TOP_NODE_NAME = 'friends';

  get userFriendsChain() {
    return this.authService.userChain.get(
      this.TOP_NODE_NAME
    ) as unknown as IGunChain<any>;
  }

  constructor(
    public readonly authService: AuthService,
    public readonly userService: UserService
  ) {
    (globalThis as any).friendService = this; // for debugging
  }

  async calculateFriendId(userId: string) {
    return await sha256(`${this.TOP_NODE_NAME}${userId}`, HashEncoding.Hex);
  }

  async extractNodeData(friendNode: GunResult<FriendNode>, key: string) {
    if (!friendNode) return null;
    const {userId, active, createdAt} = friendNode;
    // get user
    const profile = await this.userService.getById(userId);
    if (!profile) return null;
    const friend: Friend = {
      id: key,
      profile,
      active,
      createdAt,
    };
    return friend;
  }

  async addFriend(userId: string) {
    const currentFriend = await this.getByUserId(userId);
    if (currentFriend) throw this.ERRORS.FRIEND_EXISTS;
    const user = await this.userService.getById(userId);
    if (!user) throw this.ERRORS.USER_NOT_FOUND;
    // add friend
    const friendId = await this.calculateFriendId(user.id);
    const friend: FriendNode = {
      userId: user.id,
      active: true,
      createdAt: new Date().toISOString(),
    };
    await putValue(this.userFriendsChain.get(friendId), friend);
    // return newly added friend
    return this.extractNodeData(friend, friendId) as Promise<Friend>;
  }

  async getByFriendId(friendId: string) {
    return new Promise<Friend | null>(resolve =>
      this.userFriendsChain
        .get(friendId)
        .once(async (friendNode: FriendNode, key: string) => {
          if (!friendNode) return resolve(null);
          const friend = await this.extractNodeData(friendNode, key);
          resolve(friend);
        })
    );
  }

  streamByFriendId(
    friendId: string,
    callback: StreamCallback<Friend | null>,
    options?: StreamOptions
  ) {
    const stream = createStream(callback, options);
    const chain = this.userFriendsChain.get(friendId);
    // create handlers
    const friendHandler = this.createFriendStreamHandler(stream);
    // start stream
    chain.on(friendHandler);
  }

  async getByUserId(userId: string) {
    const friendId = await this.calculateFriendId(userId);
    return this.getByFriendId(friendId);
  }

  async streamByUserId(
    userId: string,
    callback: StreamCallback<Friend | null>,
    options?: StreamOptions
  ) {
    const stream = createStream(callback, options);
    const friendHandler = this.createFriendStreamHandler(stream);
    // create handlers
    const friendId = await this.calculateFriendId(userId);
    const chain = this.userFriendsChain.get(friendId)
    // start stream
    chain.on(friendHandler);
  }

  async getList() {
    const friends = new Map<string, Friend>();
    return new Promise<typeof friends>(resolve =>
      this.userFriendsChain.once(async (record: GunResult<GunLink>) => {
        if (!record) return resolve(friends);
        for (const id of extractKeys(record)) {
          const friend = await this.getByFriendId(id);
          if (friend) friends.set(id, friend as any);
        }
        return resolve(friends);
      })
    );
  }

  streamList(callback: StreamCallback<Friend | null>, options?: StreamOptions) {
    const stream = createStream(callback, options);
    const chain = this.userFriendsChain;
    // create handlers
    const listHandler = this.createFriendStreamHandler(stream);
    // start stream
    chain.map().on(listHandler);
  }

  private createFriendStreamHandler(
    stream: Stream<Friend | null>
  ) {
    const handler = deduplicateCallback(
      async (
        friendNode: GunResult<FriendNode>,
        key: string,
        message: any,
        event: IGunOnEvent,
        context?: StreamContext
      ) => {
        (context ||= new Map<string, StreamContextEntry>()).set(key, {
          raw: friendNode,
          message,
          event,
        });
        // process friend node
        const friend = !friendNode
          ? null
          : await this.extractNodeData(friendNode, key);
        // result
        return stream.emitValue(friend, context);
      }
    );
    return handler;
  }
}

export default FriendService;
