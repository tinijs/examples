import {createContentInstance} from '@tinijs/toolbox/content';
import {
  PostLite as DefaultPostLite,
  Post as DefaultPost,
} from '@tinijs/toolbox/schema';

export type PostLite = DefaultPostLite;

export type Post = DefaultPost;

export type PostContent = typeof POST_CONTENT;

export const POST_CONTENT = createContentInstance<Post>('posts');

export default POST_CONTENT;
