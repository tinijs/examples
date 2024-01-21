import {IGunChain, IGunOnEvent} from 'gun';

import {UserNode, User} from '../types/user';

import {debounce, retry, once, deduplicate} from '../helpers/common';
import {importRSAPublicKey} from '../helpers/crypto';
import {
  GUN,
  GunResult,
  GunLink,
  StreamContextItem,
  StreamContext,
  StreamCallback,
  StreamOptions,
  createStreamer,
  extractFirstKey,
  Streamer,
} from '../helpers/gun';

export class UsersService {
  readonly TOP_NODE_NAME = '#user';

  readonly usersChain = GUN.get(this.TOP_NODE_NAME);

  private readonly DIGEST_REGISTRY = new Map<string, string>();

  constructor() {
    (globalThis as any).usersService = this; // for debugging
  }

  getChainById(id: string) {
    return GUN.user(id.replace('~', '')) as unknown as IGunChain<any>;
  }

  getChainByUsername(username: string) {
    return GUN.user(`@${username}`) as unknown as IGunChain<any>;
  }

  async extractNodeData(
    userNode: GunResult<UserNode>,
    key: string,
    retries = 7
  ): Promise<User | null> {
    if (!userNode) return null;
    const {alias, pub, epub, avatar, createdAt, rsaPub} = userNode;
    if (!pub || !epub || !rsaPub) return null;
    try {
      const rpub = await importRSAPublicKey(rsaPub);
      if (!rpub) throw null;
      const user: User = {
        id: key,
        pub,
        epub,
        rpub,
        username: alias,
        name: alias,
        avatar,
        createdAt,
      };
      return user;
    } catch (error) {
      if (retries <= 0) return null;
      return await retry(() => this.extractNodeData(userNode, key, --retries));
    }
  }

  async getById(id: string) {
    const chain = this.getChainById(id);
    return new Promise<User | null>(resolve =>
      chain.once(async (userNode: UserNode, key: string) => {
        const user = await this.extractNodeData(userNode, key);
        resolve(user);
      })
    );
  }

  streamById(
    id: string,
    callback: StreamCallback<User | null>,
    options?: StreamOptions
  ) {
    const streamer = createStreamer(callback, options);
    const chain = this.getChainById(id);
    // create handlers
    const userHandler = this.createUserStreamHandler(streamer);
    // start stream
    chain.on(userHandler);
  }

  async getByUsername(username: string) {
    const chain = this.getChainByUsername(username);
    return new Promise<User | null>(resolve =>
      chain.once(async (record: GunResult<Record<string, GunLink>>) => {
        const userId = extractFirstKey(record || {});
        if (!userId) return resolve(null);
        resolve(await this.getById(userId));
      })
    );
  }

  streamByUsername(
    username: string,
    callback: StreamCallback<User | null>,
    options?: StreamOptions
  ) {
    const streamer = createStreamer(callback, options);
    const chain = this.getChainByUsername(username);
    // create handlers
    const aliasHandler = this.createAliasStreamHandler(chain, streamer);
    // start stream
    chain.on(aliasHandler);
  }

  private createUserStreamHandler(streamer: Streamer<User | null>) {
    const handler = deduplicate(
      async (
        userNode: GunResult<UserNode>,
        key: string,
        message: any,
        event: IGunOnEvent,
        context?: StreamContext
      ) => {
        (context ||= new Map<string, StreamContextItem>()).set(key, {
          raw: userNode,
          message,
          event,
        });
        // process user node
        const user = !userNode
          ? null
          : await this.extractNodeData(userNode, key);
        // result
        return streamer.emitValue(user, context);
      }
    );
    return handler;
  }

  private createAliasStreamHandler(
    chain: IGunChain<any>,
    streamer: Streamer<User | null>
  ) {
    const handler = deduplicate(
      async (
        record: GunResult<Record<string, GunLink>>,
        key: string,
        message: any,
        event: IGunOnEvent,
        context?: StreamContext
      ) => {
        (context ||= new Map<string, StreamContextItem>()).set(key, {
          raw: record,
          message,
          event,
        });
        // get user id
        const userId = extractFirstKey(record || {});
        if (!userId) return streamer.emitValue(null, context, false);
        // create handlers
        const userHandler = this.createUserStreamHandler(streamer);
        // start stream
        return chain
          .get(userId)
          .on((...params) => userHandler(...params, context));
      }
    );
    return handler;
  }
}

export default UsersService;
