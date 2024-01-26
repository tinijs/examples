import {RenderData} from '@tinijs/core';
import {createStore} from '@tinijs/store';
import {once} from '@tinijs/toolbox/common';
import {AuthService, User} from '@tinijs/toolbox/gun';

import {GUN_USER} from '../consts/gun';

export const meStore = createStore({
  auth: GUN_USER,
  user: undefined as RenderData<User>,
});

export const streamCurrentUser = once((authService: AuthService) =>
  authService.streamProfile(({data}) => {
    console.log('streamCurrentUser -> ', data);
    meStore.commit('user', data);
  })
);
