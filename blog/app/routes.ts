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
      {
        path: 'author/:slug',
        component: 'app-page-author',
        action: () => import('./pages/author'),
      },
      {
        path: 'category/:slug',
        component: 'app-page-category',
        action: () => import('./pages/category'),
      },
      {
        path: 'tag/:slug',
        component: 'app-page-tag',
        action: () => import('./pages/tag'),
      },
      {
        path: 'page/:slug',
        component: 'app-page-page',
        action: () => import('./pages/page'),
      },
      {
        path: 'post/:slug',
        component: 'app-page-post',
        action: () => import('./pages/post'),
      },
      {
        path: '**',
        component: 'app-page-404',
        action: () => import('./pages/404'),
      },
    ],
  },
] as Route[];
