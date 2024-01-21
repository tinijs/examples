import {createStore} from '@tinijs/store';

import {User, Friend} from '../types/user';
import {MessageWithContext} from '../types/thread';

import {once} from '../helpers/common';
import {ChunkData} from '../helpers/render';

import {MessagesService} from '../services/messages';

export const messagesStore = createStore({
  cachedByUserIds: new Map<
    string,
    ChunkData<Map<string, MessageWithContext>>
  >(),
});

export const streamUserByUserId = once(
  (
    friend: Friend,
    currentUser: User,
    messagesService: MessagesService,
    onMessage: (message: MessageWithContext) => void
  ) => {
    const userId = friend.profile.id;
    const currentUserId = currentUser.id;
    const messagesMap =
      messagesStore.cachedByUserIds.get(userId) ||
      new Map<string, MessageWithContext>();
    messagesService.streamUserMessages(userId, ({data}) => {
      // console.log('streamUserByUserId -> ', data?.id);
      if (!data) {
        if (!messagesStore.cachedByUserIds.get(userId)) {
          messagesStore.commit(
            'cachedByUserIds',
            messagesStore.cachedByUserIds.set(userId, null)
          );
        }
        return;
      }
      const message: MessageWithContext = data;
      messagesMap.set(data.id, message);
      messagesStore.commit(
        'cachedByUserIds',
        messagesStore.cachedByUserIds.set(userId, messagesMap)
      );
      onMessage(message);
    });
    messagesService.streamFriendMessages(userId, ({data}) => {
      // console.log('streamFriendMessages -> ', data?.id);
      if (!data || userId === currentUserId) {
        if (!messagesStore.cachedByUserIds.get(userId)) {
          messagesStore.commit(
            'cachedByUserIds',
            messagesStore.cachedByUserIds.set(userId, null)
          );
        }
        return;
      }
      const message: MessageWithContext = {...data, sender: friend};
      messagesMap.set(data.id, message);
      messagesStore.commit(
        'cachedByUserIds',
        messagesStore.cachedByUserIds.set(userId, messagesMap)
      );
      onMessage(message);
    });
  },
  (friend, currentUser) =>
    `messagesStore/streamUserByUserId/${friend.profile.id}-${currentUser.id}`
);
