import {DependencyProviders} from '@tinijs/core';

export default {
  GUN_INSTANCE: () => import('./consts/gun'),
  userService: {
    provider: () => import('@tinijs/toolbox/gun/services/user'),
    deps: ['GUN_INSTANCE'],
  },
  authService: {
    provider: () => import('@tinijs/toolbox/gun/services/auth'),
    deps: ['userService', 'GUN_INSTANCE'],
  },
  friendService: {
    provider: () => import('./services/friend'),
    deps: ['authService', 'userService'],
  },
  threadService: {
    provider: () => import('./services/thread'),
    deps: ['authService', 'userService', 'friendService'],
  },
  massageService: {
    provider: () => import('./services/message'),
    deps: ['authService', 'userService', 'friendService', 'threadService'],
  },
} as DependencyProviders;
