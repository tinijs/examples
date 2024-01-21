import {HashEncoding, hash} from './crypto';

export async function retry<Value>(
  handler: () => Promise<Value>,
  withTimeout: false | number = 0
) {
  return new Promise<Value>(async resolve =>
    typeof withTimeout !== 'number' || withTimeout < 0
      ? resolve(await handler())
      : setTimeout(async () => resolve(await handler()), withTimeout)
  );
}

export function debounce(target: Function, timeout = 100) {
  let timer: any;
  return (...params: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => target.apply(target, params), timeout);
  };
}

export function once<Target extends (...params: any[]) => any>(
  target: Target,
  id?: string | symbol | ((...params: Parameters<Target>) => string)
): Target {
  const tracker = new Map<string | symbol, boolean>();
  const autoId = Symbol();
  return ((...params: any[]) => {
    const callId: string | symbol = !id
      ? autoId
      : typeof id !== 'function'
      ? id
      : id(...(params as Parameters<Target>));
    if (!tracker.get(callId)) {
      tracker.set(callId, true);
      target.apply(target, params);
    }
  }) as Target;
}

export function deduplicate<Target extends (...params: any[]) => any>(
  target: Target
): Target {
  const registry = new Map<string, string>();
  return (async (...params: any[]) => {
    const key = params[1] as string;
    const data = params[0] as any;
    // calculate new digest
    let newDigest: string | undefined;
    try {
      newDigest = await hash(
        data instanceof Object ? JSON.stringify(data) : String(data),
        HashEncoding.Hex
      );
    } catch (error) {
      console.error(error);
    }
    // retrieve current digest
    const currentDigest = registry.get(key);
    // no change or no new digest
    if (newDigest && newDigest === currentDigest) return;
    // change detected
    if (newDigest) registry.set(key, newDigest);
    return target.apply(target, params);
  }) as Target;
}
