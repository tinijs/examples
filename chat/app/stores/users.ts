import {RenderData} from '@tinijs/core';
import {createStore} from '@tinijs/store';
import {once} from '@tinijs/toolbox/common';
import {UserService, User} from '@tinijs/toolbox/gun';

export const usersStore = createStore({
  cachedByIds: new Map<string, RenderData<User>>(),
  cachedByUsernames: new Map<string, RenderData<User>>(),
});

export const streamUserById = once(
  (id: string, userService: UserService) =>
    userService.streamById(id, ({data}) => {
      // console.log('streamById -> ', data?.id);
      usersStore.commit('cachedByIds', usersStore.cachedByIds.set(id, data));
    }),
  id => `usersStore/streamUserById/${id}`
);

export const streamUserByUsername = once(
  (username: string, userService: UserService) =>
    userService.streamByAlias(username, ({data}) => {
      // console.log('streamByUsername -> ', data?.id);
      usersStore.commit(
        'cachedByUsernames',
        usersStore.cachedByUsernames.set(username, data)
      );
    }),
  username => `usersStore/streamUserByUsername/${username}`
);
