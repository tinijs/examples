import {Route} from '@tinijs/router';

export default [
  {
    path: '',
    component: 'app-layout-default',
    children: [
      {
        path: '',
        component: 'app-page-home',
        action: () => import('./pages/home'),
      },
      // auth
      {
        path: 'register',
        component: 'app-page-register',
        action: () => import('./pages/register'),
      },
      {
        path: 'login',
        component: 'app-page-login',
        action: () => import('./pages/login'),
      },
      {
        path: 'profile/:alias',
        component: 'app-page-profile',
        action: () => import('./pages/profile'),
      },
      // thread
      {
        path: 'thread/:id',
        component: 'app-page-thread',
        action: () => import('./pages/thread'),
      },
      // scan
      {
        path: 'scan',
        component: 'app-page-scan',
        action: () => import('./pages/scan'),
      },
      // 404
      {
        path: '**',
        component: 'app-page-404',
        action: () => import('./pages/404'),
      },
    ],
  },
] as Route[];
