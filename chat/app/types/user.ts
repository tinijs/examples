export interface UserNode {
  alias: string;
  pub: string;
  epub: string;
  avatar: string;
  createdAt: string;
  rsaPub: string;
  rsaPriv: string;
}

export type User = Pick<UserNode, 'pub' | 'epub' | 'avatar' | 'createdAt'> & {
  id: string;
  username: string;
  name: string;
  rpub: CryptoKey;
};

export type EditableProfile = Partial<Pick<User, 'avatar'>>;

export interface FriendNode {
  userId: string;
  active: boolean;
  createdAt: string;
}

export type Friend = Pick<FriendNode, 'active' | 'createdAt'> & {
  id: string;
  profile: User;
};
