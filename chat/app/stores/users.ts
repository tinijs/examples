import {createStore} from '@tinijs/store';

import {User} from '../types/user';

import {once} from '../helpers/common';
import {ChunkData} from '../helpers/render';

import {UsersService} from '../services/users';

export const usersStore = createStore({
  cachedByIds: new Map<string, ChunkData<User>>(),
  cachedByUsernames: new Map<string, ChunkData<User>>(),
});

export const streamUserById = once(
  (id: string, usersService: UsersService) =>
    usersService.streamById(id, ({data}) => {
      // console.log('streamById -> ', data?.id);
      usersStore.commit('cachedByIds', usersStore.cachedByIds.set(id, data));
    }),
  id => `usersStore/streamUserById/${id}`
);

export const streamUserByUsername = once(
  (username: string, usersService: UsersService) =>
    usersService.streamByUsername(username, ({data}) => {
      // console.log('streamByUsername -> ', data?.id);
      usersStore.commit(
        'cachedByUsernames',
        usersStore.cachedByUsernames.set(username, data)
      );
    }),
  username => `usersStore/streamUserByUsername/${username}`
);
