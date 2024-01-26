import {User} from '@tinijs/toolbox/gun';

export interface FriendNode {
  userId: string;
  active: boolean;
  createdAt: string;
}

export type Friend = Pick<FriendNode, 'active' | 'createdAt'> & {
  id: string;
  profile: User;
};
