import {User, EditableProfile} from '../types/user';

import {
  GUN,
  SEA,
  GUN_USER,
  StreamCallback,
  emitStaticValue,
  setValues,
  setValue,
} from '../helpers/gun';
import {
  hash,
  hashSecret,
  generateRSAKeys,
  rsaEncrypt,
  rsaDecrypt,
} from '../helpers/crypto';

import {UsersService} from './users';

export class AuthService {
  private readonly ERRORS = {
    NO_USER: new Error('Unauthenticated!'),
    NO_RSA: new Error('RSA key pair not loaded!'),
    NO_SECRET: new Error('Failed to generate secret!'),
    NO_ENCRYPTION_DATA: new Error('Empty data!'),
    ENCRYPT_FAILED: new Error('Failed to encrypt data!'),
    DECRYPT_FAILED: new Error('Failed to decrypt data!'),
    SIGNOUT_FAILED: new Error('Failed to sign out!'),
  };

  readonly userChain = GUN_USER;

  constructor(public readonly usersService: UsersService) {
    (globalThis as any).authService = this; // for debugging
  }

  get currentUser() {
    const pair = (this.userChain._ as any)?.sea;
    const rsaPair = (this.userChain as any).rsa as {
      rpub: CryptoKey;
      rpriv: CryptoKey;
    };
    if (!pair) throw this.ERRORS.NO_USER;
    return {
      chain: this.userChain,
      id: `~${pair.pub}`,
      // original keys
      pair,
      pub: pair.pub,
      epub: pair.epub,
      // rsa keys
      rsaPair,
      rpub: rsaPair?.rpub,
    };
  }

  get userId() {
    return this.currentUser.id;
  }

  get userPair() {
    return this.currentUser.pair;
  }

  get userPub() {
    return this.currentUser.pub;
  }

  get userEpub() {
    return this.currentUser.epub;
  }

  get userRSAPair() {
    const pair = this.currentUser.rsaPair;
    if (!pair) throw this.ERRORS.NO_RSA;
    return pair;
  }

  get userRpub() {
    return this.userRSAPair.rpub;
  }

  async hashSecretData(participantEpub: string, data: string) {
    const secret = await SEA.secret(participantEpub, this.userPair);
    if (!secret) throw this.ERRORS.NO_SECRET;
    return hashSecret(data, secret);
  }

  async encryptData(raw: string, receiverEpub?: string): Promise<string> {
    if (!raw) throw this.ERRORS.NO_ENCRYPTION_DATA;
    const secret = !receiverEpub
      ? this.userPair
      : await SEA.secret(receiverEpub, this.userPair);
    if (!secret) throw this.ERRORS.NO_SECRET;
    const result = await SEA.encrypt(raw, secret);
    if (!result || typeof result !== 'string') throw this.ERRORS.ENCRYPT_FAILED;
    return result;
  }

  async decryptData(cipherPlus: string, senderEpub?: string): Promise<string> {
    if (!cipherPlus) throw this.ERRORS.NO_ENCRYPTION_DATA;
    const secret = !senderEpub
      ? this.userPair
      : await SEA.secret(senderEpub, this.userPair);
    if (!secret) throw this.ERRORS.NO_SECRET;
    const result = await SEA.decrypt(cipherPlus, secret);
    if (!result || typeof result !== 'string') throw this.ERRORS.DECRYPT_FAILED;
    return result;
  }

  async encryptDataRSA(receiverRpub: CryptoKey, raw: string) {
    return rsaEncrypt(receiverRpub, raw);
  }

  async decryptDataRSA(cipherPlus: string) {
    return rsaDecrypt(this.userRSAPair.rpriv, cipherPlus);
  }

  async getProfile() {
    return this.usersService.getById(this.userId);
  }

  async streamProfile(callback: StreamCallback<User | null>) {
    try {
      this.usersService.streamById(this.userId, callback);
    } catch (error) {
      emitStaticValue(callback);
    }
  }

  async updateProfile(editableProfile: EditableProfile) {
    return setValues(this.userChain as any, editableProfile);
  }

  async createUser(
    username: string,
    password: string,
    editableProfile: EditableProfile
  ) {
    return new Promise<true>((resolve, reject) =>
      this.userChain.create(username, password, async (result: any) => {
        if (result.err) return reject(new Error(result.err));
        resolve(await this.initProfile(username, password, editableProfile));
      })
    );
  }

  async signIn(username: string, password: string) {
    return new Promise<true>((resolve, reject) =>
      this.userChain.auth(username, password, (result: any) => {
        if (result.err) return reject(new Error(result.err));
        resolve(true);
      })
    );
  }

  signOut() {
    this.userChain.leave();
    delete (this.userChain as any).rsa;
    if ((this.userChain._ as any)?.sea) {
      throw this.ERRORS.SIGNOUT_FAILED;
    }
  }

  private async initProfile(
    username: string,
    password: string,
    editableProfile: EditableProfile
  ) {
    return new Promise<true>((resolve, reject) =>
      this.userChain.auth(username, password, async (result: any) => {
        if (result.err) return reject(new Error(result.err));
        // user profile
        const {publicKey, privateKey} = await generateRSAKeys();
        const rsaPriv = await this.encryptData(privateKey);
        await setValues(this.userChain as any, {
          ...editableProfile,
          createdAt: new Date().toISOString(),
          rsaPub: publicKey,
          rsaPriv,
        });
        // users index
        const userId = this.userId;
        const userIdHash = await hash(userId);
        await setValue(GUN.get('#users'), userIdHash, userId);
        // result
        resolve(true);
      })
    );
  }
}

export default AuthService;
