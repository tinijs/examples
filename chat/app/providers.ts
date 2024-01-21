import {DependencyProviders} from '@tinijs/core';

export default {
  usersService: () => import('./services/users'),
  authService: {
    provider: () => import('./services/auth'),
    deps: ['usersService'],
  },
  friendsService: {
    provider: () => import('./services/friends'),
    deps: ['authService', 'usersService'],
  },
  threadsService: {
    provider: () => import('./services/threads'),
    deps: ['authService', 'usersService', 'friendsService'],
  },
  messagesService: {
    provider: () => import('./services/messages'),
    deps: ['authService', 'usersService', 'friendsService', 'threadsService'],
  },
} as DependencyProviders;
