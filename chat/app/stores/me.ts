import {createStore} from '@tinijs/store';

import {User} from '../types/user';

import {once} from '../helpers/common';
import {ChunkData} from '../helpers/render';
import {GUN_USER} from '../helpers/gun';

import {AuthService} from '../services/auth';

export const meStore = createStore({
  auth: GUN_USER,
  user: undefined as ChunkData<User>,
});

export const streamCurrentUser = once((authService: AuthService) =>
  authService.streamProfile(({data}) => {
    console.log('streamCurrentUser -> ', data);
    meStore.commit('user', data);
  })
);
