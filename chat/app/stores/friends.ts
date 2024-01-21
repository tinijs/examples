import {createStore} from '@tinijs/store';

import {Friend} from '../types/user';

import {once} from '../helpers/common';
import {ChunkData} from '../helpers/render';
import {HashEncoding, hash} from '../helpers/crypto';

import {FriendsService} from '../services/friends';

interface FriendWithDigest {
  ___: string;
  data: Friend;
}

export const friendsStore = createStore({
  list: undefined as ChunkData<Map<string, FriendWithDigest>>,
  cachedByFriendIds: new Map<string, Friend | null>(),
  cachedByUserIds: new Map<string, Friend | null>(),
});

export const streamFriendList = once(async (friendsService: FriendsService) => {
  const storeList = (friendsStore.list ||= new Map<string, FriendWithDigest>());
  // get current friends
  // console.time('currentList');
  const currentList = (await friendsService.getList()) as unknown as Map<
    string,
    FriendWithDigest
  >;
  currentList.forEach(async friend => {
    try {
      friend.___ = await hash(JSON.stringify(friend), HashEncoding.Hex);
    } catch (error) {}
  });
  // storeList = currentList;
  // console.timeEnd('currentList');
  // console.log('get friend list ->', storeList.size, currentList);

  // stream new friends
  friendsService.streamList(async ({data}) => {
    if (!data) {
      if (friendsStore.list) return;
      return friendsStore.commit('list', null);
    }
    const currentItem = storeList.get(data.id);
    const newItem = data as unknown as FriendWithDigest;
    newItem.___ = await hash(JSON.stringify(data), HashEncoding.Hex);
    // console.log('streamFriendList ->', Date.now(), data.id, currentItem?.___ === newItem.___);
    if (currentItem?.___ === newItem.___) return;
    // console.log('new friend ->', data);
    return friendsStore.commit('list', storeList.set(data.id, newItem));
  });
});

export const streamUserByFriendId = once(
  (friendId: string, friendsService: FriendsService) =>
    friendsService.streamByFriendId(friendId, ({data}) => {
      // console.log('streamUserByFriendId -> ', data?.id);
      friendsStore.commit(
        'cachedByFriendIds',
        friendsStore.cachedByFriendIds.set(friendId, data)
      );
    }),
  friendId => `friendsStore/streamUserByFriendId/${friendId}`
);

export const streamUserByUserId = once(
  (userId: string, friendsService: FriendsService) =>
    friendsService.streamByUserId(userId, ({data}) => {
      // console.log('streamUserByUserId -> ', data?.id);
      friendsStore.commit(
        'cachedByUserIds',
        friendsStore.cachedByUserIds.set(userId, data)
      );
    }),
  userId => `friendsStore/streamUserByUserId/${userId}`
);
