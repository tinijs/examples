import {RenderData} from '@tinijs/core';
import {createStore} from '@tinijs/store';
import {once} from '@tinijs/toolbox/common';
import {User} from '@tinijs/toolbox/gun';

import {Friend} from '../types/friend';
import {MessageWithContext} from '../types/thread';

import {MassageService} from '../services/message';

export const messagesStore = createStore({
  cachedByUserIds: new Map<
    string,
    RenderData<Map<string, MessageWithContext>>
  >(),
});

export const streamUserByUserId = once(
  (
    friend: Friend,
    currentUser: User,
    massageService: MassageService,
    onMessage: (message: MessageWithContext) => void
  ) => {
    const userId = friend.profile.id;
    const currentUserId = currentUser.id;
    const messagesMap =
      messagesStore.cachedByUserIds.get(userId) ||
      new Map<string, MessageWithContext>();
    massageService.streamUserMessages(userId, ({data}) => {
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
    massageService.streamFriendMessages(userId, ({data}) => {
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
