import {createContentInstance, ContentService} from '@tinijs/toolbox/content';
import {
  CategoryLite as DefaultCategoryLite,
  Category as DefaultCategory,
} from '@tinijs/toolbox/schema';

export type CategoryLite = DefaultCategoryLite;
export type Category = DefaultCategory;

export type CategoryContentService = ContentService<CategoryLite, Category>;

export type CategoryContent = typeof CATEGORY_CONTENT;
export const CATEGORY_CONTENT = createContentInstance<CategoryLite, Category>(
  'categories'
);
export default CATEGORY_CONTENT;
