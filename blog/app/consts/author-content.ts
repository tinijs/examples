import {createContentInstance, ContentService} from '@tinijs/toolbox/content';
import {
  AuthorLite as DefaultAuthorLite,
  Author as DefaultAuthor,
} from '@tinijs/toolbox/schema';

export type AuthorLite = DefaultAuthorLite;
export type Author = DefaultAuthor;

export type AuthorContentService = ContentService<AuthorLite, Author>;

export type AuthorContent = typeof AUTHOR_CONTENT;
export const AUTHOR_CONTENT = createContentInstance<AuthorLite, Author>(
  'authors'
);
export default AUTHOR_CONTENT;
