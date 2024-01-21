import {IGunChain, IGunOnEvent} from 'gun';
import gun from 'gun/gun';
import 'gun/lib/radix';
import 'gun/lib/radisk';
import 'gun/lib/store';
import 'gun/lib/rindexed';
import 'gun/sea';

import {UserNode} from '../types/user';

import {retry} from './common';
import {
  importRSAPublicKey,
  importRSAPrivateKey,
} from './crypto';

/*
 * Main
 */

export const GUN = gun({
  localStorage: false,
  peers: [
    'https://gun-manhattan.herokuapp.com/gun',
    'https://peer.wallie.io/gun',
    'https://gundb-relay-mlccl.ondigitalocean.app/gun',
    'https://plankton-app-6qfp3.ondigitalocean.app',
  ],
});
export const SEA = gun.SEA;
export const GUN_USER = GUN.user();

(globalThis as any).gun = GUN;
(globalThis as any).gunUser = GUN_USER;

/*
 * Auth actions
 */

(async () => {
  async function loadRSAPair(retries = 7) {
    const userChain = GUN_USER as any;
    if (userChain.is) {
      try {
        await new Promise((resolve, reject) => {
          userChain.once(async (userNode: GunResult<UserNode>) => {
            if (!userNode?.rsaPub || !userNode?.rsaPriv)
              return reject(new Error('No RSA keys'));
            const publicKey = userNode.rsaPub;
            const privateKey = await SEA.decrypt(
              userNode.rsaPriv,
              userChain._.sea
            );
            return resolve(
              (userChain.rsa = {
                rpub: await importRSAPublicKey(publicKey),
                rpriv: await importRSAPrivateKey(privateKey),
              })
            );
          });
        });
      } catch (error: any) {
        // retry if available
      }
    }
    if (!userChain.rsa && retries > 0) {
      retry(() => loadRSAPair(--retries), 250);
    }
  }
  GUN_USER.recall({sessionStorage: true});
  await loadRSAPair();
})();

/*
 * Types
 */

export type GunResult<Type> = Type | null | undefined;
export type GunLink = GunResult<{'#': string}>;

export interface StreamOptions {
  timeout?: number;
}
export interface StreamContextItem {
  raw: GunResult<unknown>;
  message: any;
  event: IGunOnEvent;
}
export type StreamContext = Map<string, StreamContextItem>;
export interface StreamResult<Data> {
  data: Data;
  unstream: () => void;
  context: StreamContext;
}
export type StreamCallback<Data> = (result: StreamResult<Data>) => void;
export type Unstream = ReturnType<typeof createUnstream>;

type ExcludeLast<T extends any[]> = T extends [...infer ExcludeLast, any]
  ? ExcludeLast
  : any[];
type ExtractGeneric<Type> = Type extends StreamCallback<infer Target>
  ? Target
  : never;

/*
 * Streamer
 */

export function createUnstream(context: StreamContext) {
  return () => context.forEach(item => item.event.off());
}

export function emitStaticValue<Data>(
  callback: StreamCallback<Data>,
  value?: Data
) {
  if (!callback) return;
  return callback({
    data: value ?? (null as Data),
    unstream: () => undefined,
    context: new Map<string, StreamContextItem>(),
  });
}

export function emitStreamValue<Data>(
  data: Data,
  context: StreamContext,
  callback: StreamCallback<Data>
) {
  if (!context || !callback) return;
  return callback({
    data,
    unstream: createUnstream(context),
    context,
  });
}

export class Streamer<Data> {
  resolveCount = 0;

  constructor(private callback: StreamCallback<Data>) {}

  emitValue(data: Data, context: StreamContext, success = true) {
    if (success) this.resolveCount++;
    emitStreamValue(data, context, this.callback);
    return this;
  }
}

export function createStreamer<Data>(
  callback: StreamCallback<Data>,
  {timeout = 5000}: StreamOptions = {}
) {
  const streamer = new Streamer(callback);
  // handle timeout
  if (timeout && timeout > -1) {
    setTimeout(() => {
      if (streamer.resolveCount > 0 || !callback) return;
      emitStaticValue(callback);
    }, timeout);
  }
  // return streamer
  return streamer;
}

export async function promisifyStream<
  Method extends (...params: any[]) => any,
  Data = ExtractGeneric<Parameters<Method>[1]>,
>(method: Method, ...params: ExcludeLast<Parameters<Method>>) {
  return new Promise<Data>(resolve =>
    method(...params, ({data, unstream}: StreamResult<Data>) => {
      unstream();
      resolve(data);
    })
  );
}

/*
 * Utils
 */

export function extractEntries<Value>(data: Record<string, Value>) {
  return Object.entries<Value>(data).filter(([key]) => key && key !== '_');
}

export function extractFirstEntry<Value>(data: Record<string, Value>) {
  return extractEntries(data)[0] as [string, Value] | undefined;
}

export function extractValues<Value>(data: Record<string, Value>) {
  return extractEntries(data).map(([, value]) => value);
}

export function extractFirstValue<Value>(data: Record<string, Value>) {
  return extractValues(data)[0] as Value | undefined;
}

export function extractKeys(data: Record<string, unknown>) {
  return extractEntries(data).map(([key]) => key) as string[];
}

export function extractFirstKey(data: Record<string, unknown>) {
  return extractKeys(data)[0] as string | undefined;
}

export async function putValue(chain: IGunChain<any>, value: any) {
  return new Promise<true>((resolve, reject) =>
    chain.put(value, (result: any) => {
      if (result.err) return reject(new Error(result.err));
      resolve(true);
    })
  );
}

export async function setValue(chain: IGunChain<any>, key: string, value: any) {
  return new Promise<true>((resolve, reject) =>
    chain.get(key).put(value, (result: any) => {
      if (result.err) return reject(new Error(result.err));
      resolve(true);
    })
  );
}

export async function setValues(
  chain: IGunChain<any>,
  data: Record<string, any>,
  retries = 7
): Promise<true> {
  const clonedData = retries < 7 ? data : JSON.parse(JSON.stringify(data));
  for (const [key, value] of Object.entries(clonedData)) {
    try {
      await setValue(chain, key, value);
      delete clonedData[key];
    } catch (error: any) {
      if (retries <= 0)
        throw new Error(`Failed to set values! ${error.message}`);
      return await retry(() => setValues(chain, clonedData, --retries));
    }
  }
  return true;
}
