export enum HashEncoding {
  Base64 = 'base64',
  Hex = 'hex',
  Utf8 = 'utf8',
}

const RSA_ALGORITHM: RsaHashedKeyGenParams = {
  name: 'RSA-OAEP',
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: 'SHA-256',
};

const HMAC_ALGORITHM: HmacKeyGenParams = {name: 'HMAC', hash: 'SHA-256'};

export function binaryToHex(binary: ArrayBuffer) {
  return Array.from(new Uint8Array(binary))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBinary(hex: string) {
  return Uint8Array.from(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
}

export function textToBinary(text: string) {
  return new TextEncoder().encode(text);
}

export function binaryToText(binary: ArrayBuffer) {
  return new TextDecoder('utf-8').decode(binary);
}

export function binaryToBase64(binary: ArrayBuffer, noPadding = false) {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(binary)));
  return !noPadding ? base64 : base64.replace(/=+$/, '');
}

export function base64ToBinary(base64: string) {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

export async function importRSAPublicKey(base64: string) {
  const keyData = base64ToBinary(base64);
  return await crypto.subtle.importKey('spki', keyData, RSA_ALGORITHM, false, [
    'encrypt',
  ]);
}

export async function importRSAPrivateKey(base64: string) {
  const keyData = base64ToBinary(base64);
  return await crypto.subtle.importKey('pkcs8', keyData, RSA_ALGORITHM, false, [
    'decrypt',
  ]);
}

export async function generateRSAKeys() {
  const pair = await globalThis.crypto.subtle.generateKey(RSA_ALGORITHM, true, [
    'encrypt',
    'decrypt',
  ]);
  return {
    publicKey: binaryToBase64(
      await globalThis.crypto.subtle.exportKey('spki', pair.publicKey),
      true
    ),
    privateKey: binaryToBase64(
      await globalThis.crypto.subtle.exportKey('pkcs8', pair.privateKey),
      true
    ),
  };
}

export async function rsaEncrypt(publicKey: CryptoKey, raw: string) {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const cipher = await crypto.subtle.encrypt(
    {
      name: RSA_ALGORITHM.name,
      iv,
    },
    publicKey,
    textToBinary(raw)
  );
  const vector = binaryToBase64(iv, true);
  return `RSA${JSON.stringify({
    ct: binaryToBase64(cipher, true),
    iv: vector,
  })}`;
}

export async function rsaDecrypt(privateKey: CryptoKey, cipherPlus: string) {
  if (!cipherPlus.startsWith('RSA')) throw new Error('Invalid cipher content!');
  const {ct: cipher, iv: vector} = JSON.parse(cipherPlus.slice(3)) as {
    ct: string;
    iv: string;
  };
  const rawData = await crypto.subtle.decrypt(
    {
      name: RSA_ALGORITHM.name,
      iv: base64ToBinary(vector),
    },
    privateKey,
    base64ToBinary(cipher)
  );
  return binaryToText(rawData);
}

export async function hash(
  input: string,
  encode: HashEncoding = HashEncoding.Base64
) {
  const hash = await crypto.subtle.digest('SHA-256', textToBinary(input));
  return encode === HashEncoding.Utf8
    ? binaryToText(hash)
    : encode === HashEncoding.Hex
    ? binaryToHex(hash)
    : binaryToBase64(hash);
}

export async function hashSecret(
  input: string,
  secret: string,
  encode: HashEncoding = HashEncoding.Base64
) {
  const key = await crypto.subtle.importKey(
    'raw',
    textToBinary(secret),
    HMAC_ALGORITHM,
    false,
    ['sign', 'verify']
  );
  const signature = await crypto.subtle.sign(
    HMAC_ALGORITHM.name,
    key,
    textToBinary(input)
  );
  return encode === HashEncoding.Utf8
    ? binaryToText(signature)
    : encode === HashEncoding.Hex
    ? binaryToHex(signature)
    : binaryToBase64(signature);
}
