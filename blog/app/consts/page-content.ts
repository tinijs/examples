import {createContentInstance, ContentService} from '@tinijs/toolbox/content';
import {
  PageLite as DefaultPageLite,
  Page as DefaultPage,
} from '@tinijs/toolbox/schema';

export type PageLite = DefaultPageLite;
export type Page = DefaultPage;

export type PageContentService = ContentService<PageLite, Page>;

export type PageContent = typeof PAGE_CONTENT;
export const PAGE_CONTENT = createContentInstance<PageLite, Page>('pages');
export default PAGE_CONTENT;
