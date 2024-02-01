import {createContentInstance} from '@tinijs/toolbox/content';
import {
  CategoryLite as DefaultCategoryLite,
  Category as DefaultCategory,
} from '@tinijs/toolbox/schema';

export type CategoryLite = DefaultCategoryLite;

export type Category = DefaultCategory;

export type CategoryContent = typeof CATEGORY_CONTENT;

export const CATEGORY_CONTENT = createContentInstance<Category>('categories');

export default CATEGORY_CONTENT;
