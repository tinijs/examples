import {IGunChain, IGunOnEvent} from 'gun';

import {FriendNode, Friend, User} from '../types/user';

import {debounce, once} from '../helpers/common';
import {HashEncoding, hash} from '../helpers/crypto';
import {
  GunResult,
  StreamContext,
  StreamCallback,
  StreamOptions,
  putValue,
  createStreamer,
  promisifyStream,
  StreamContextItem,
  Streamer,
  GunLink,
  extractKeys,
} from '../helpers/gun';

import {AuthService} from './auth';
import {UsersService} from './users';

export class FriendsService {
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
    public readonly usersService: UsersService
  ) {
    (globalThis as any).friendsService = this; // for debugging
  }

  async calculateFriendId(userId: string) {
    return await hash(`${this.TOP_NODE_NAME}${userId}`, HashEncoding.Hex);
  }

  async extractNodeData(friendNode: GunResult<FriendNode>, key: string) {
    if (!friendNode) return null;
    const {userId, active, createdAt} = friendNode;
    // get user
    const profile = await promisifyStream(
      this.usersService.streamById.bind(this.usersService),
      userId
    );
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
    const currentFriend = await promisifyStream(
      this.streamByUserId.bind(this),
      userId
    );
    if (currentFriend) throw this.ERRORS.FRIEND_EXISTS;
    const user = await promisifyStream(
      this.usersService.streamById.bind(this.usersService),
      userId
    );
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
    const streamer = createStreamer(callback, options);
    const chain = this.userFriendsChain.get(friendId);
    // create handlers
    const friendHandler = this.createFriendStreamHandler(streamer);
    // start stream
    chain.on(friendHandler);
  }

  async getByUserId(userId: string) {
    const friendId = await this.calculateFriendId(userId);
    return this.getByFriendId(friendId);
  }

  streamByUserId(
    userId: string,
    callback: StreamCallback<Friend | null>,
    options?: StreamOptions
  ) {
    const streamer = createStreamer(callback, options);
    const friendHandler = this.createFriendStreamHandler(streamer);
    // start stream
    this.usersService.streamById(
      userId,
      once(async ({data: user, context}) => {
        if (!user) return streamer.emitValue(null, context);
        const friendId = await this.calculateFriendId(user.id);
        return this.userFriendsChain
          .get(friendId)
          .on((...params) => friendHandler(...params, context));
      })
    );
  }

  async getList() {
    const friends = new Map<string, Friend>();
    return new Promise<typeof friends>(resolve =>
      this.userFriendsChain.once(async (record: GunResult<GunLink>) => {
        if (!record) return resolve(friends);
        const ids = extractKeys(record);
        for (const id of ids) {
          const friend = await this.getByFriendId(id);
          if (friend) friends.set(id, friend as any);
        }
        return resolve(friends);
      })
    );
  }

  streamList(callback: StreamCallback<Friend | null>, options?: StreamOptions) {
    const streamer = createStreamer(callback, options);
    const chain = this.userFriendsChain;
    const listHandler = this.createFriendStreamHandler(streamer, true);
    // start stream
    chain.map().on(listHandler);
  }

  private createFriendStreamHandler(
    streamer: Streamer<Friend | null>,
    noDebounce = false
  ) {
    const handler = async (
      friendNode: GunResult<FriendNode>,
      key: string,
      message: any,
      event: IGunOnEvent,
      context?: StreamContext
    ) => {
      (context ||= new Map<string, StreamContextItem>()).set(key, {
        raw: friendNode,
        message,
        event,
      });
      // process friend node
      const friend = !friendNode
        ? null
        : await this.extractNodeData(friendNode, key);
      // result
      return streamer.emitValue(friend, context);
    };
    return noDebounce ? handler : debounce(handler);
  }
}

export default FriendsService;
