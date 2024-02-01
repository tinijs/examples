import {DependencyProviders} from '@tinijs/core';

export default {
  AUTHOR_CONTENT: () => import('./consts/author-content'),
  authorContentService: {
    provider: () => import('@tinijs/toolbox/content/service'),
    deps: ['AUTHOR_CONTENT'],
  },
  CATEGORY_CONTENT: () => import('./consts/category-content'),
  categoryContentService: {
    provider: () => import('@tinijs/toolbox/content/service'),
    deps: ['CATEGORY_CONTENT'],
  },
  TAG_CONTENT: () => import('./consts/tag-content'),
  tagContentService: {
    provider: () => import('@tinijs/toolbox/content/service'),
    deps: ['TAG_CONTENT'],
  },
  PAGE_CONTENT: () => import('./consts/page-content'),
  pageContentService: {
    provider: () => import('@tinijs/toolbox/content/service'),
    deps: ['PAGE_CONTENT'],
  },
  POST_CONTENT: () => import('./consts/post-content'),
  postContentService: {
    provider: () => import('@tinijs/toolbox/content/service'),
    deps: ['POST_CONTENT'],
  },
} as DependencyProviders;
