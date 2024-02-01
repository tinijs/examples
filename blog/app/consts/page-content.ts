import {createContentInstance} from '@tinijs/toolbox/content';
import {
  PageLite as DefaultPageLite,
  Page as DefaultPage,
} from '@tinijs/toolbox/schema';

export type PageLite = DefaultPageLite;

export type Page = DefaultPage;

export type PageContent = typeof PAGE_CONTENT;

export const PAGE_CONTENT = createContentInstance<Page>('pages');

export default PAGE_CONTENT;
