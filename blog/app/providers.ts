import {DependencyProviders} from '@tinijs/core';

import {AUTHOR_CONTENT} from './consts/author-content';
import {CATEGORY_CONTENT} from './consts/category-content';
import {TAG_CONTENT} from './consts/tag-content';
import {PAGE_CONTENT} from './consts/page-content';
import {POST_CONTENT} from './consts/post-content';

export default {
  authorContentService: {
    provider: () => import('@tinijs/toolbox/content/service'),
    deps: [() => AUTHOR_CONTENT],
  },
  categoryContentService: {
    provider: () => import('@tinijs/toolbox/content/service'),
    deps: [() => CATEGORY_CONTENT],
  },
  tagContentService: {
    provider: () => import('@tinijs/toolbox/content/service'),
    deps: [() => TAG_CONTENT],
  },
  pageContentService: {
    provider: () => import('@tinijs/toolbox/content/service'),
    deps: [() => PAGE_CONTENT],
  },
  postContentService: {
    provider: () => import('@tinijs/toolbox/content/service'),
    deps: [() => POST_CONTENT],
  },
} as DependencyProviders;
