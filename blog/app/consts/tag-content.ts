import {createContentInstance, ContentService} from '@tinijs/toolbox/content';
import {
  TagLite as DefaultTagLite,
  Tag as DefaultTag,
} from '@tinijs/toolbox/schema';

export type TagLite = DefaultTagLite;
export type Tag = DefaultTag;

export type TagContentService = ContentService<TagLite, Tag>;

export type TagContent = typeof TAG_CONTENT;
export const TAG_CONTENT = createContentInstance<TagLite, Tag>('tags');
export default TAG_CONTENT;