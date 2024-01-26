import {Friend} from './friend';

export interface ThreadNode {
  friendId: string;
  createdAt: string;
  latestContent$$: string;
  latestAt: string;
  latestMine: boolean;
}

export type Thread = Pick<
  ThreadNode,
  'createdAt' | 'latestAt' | 'latestMine'
> & {
  id: string;
  friend: Friend;
  latestContent: string;
};

export interface MessageNode {
  content$$: string;
  createdAt: string;
}

export type Message = Pick<MessageNode, 'createdAt'> & {
  id: string;
  content: string;
};

export interface MessageWithContext extends Message {
  sender?: Friend;
}
