import {createContentInstance} from '@tinijs/toolbox/content';
import {
  AuthorLite as DefaultAuthorLite,
  Author as DefaultAuthor,
} from '@tinijs/toolbox/schema';

export type AuthorLite = DefaultAuthorLite;

export type Author = DefaultAuthor;

export type AuthorContent = typeof AUTHOR_CONTENT;

export const AUTHOR_CONTENT = createContentInstance<Author>('authors');

export default AUTHOR_CONTENT;
