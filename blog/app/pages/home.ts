import {html} from 'lit';

import {
  Page,
  TiniComponent,
  Inject,
  OnInit,
  Reactive,
  render,
  RenderData,
} from '@tinijs/core';
import {ContentService} from '@tinijs/toolbox/content';

import {Category} from '../consts/category-content';
import {Post} from '../consts/post-content';
import {Tag} from '../consts/tag-content';

import {AppCategoriesComponent} from '../components/categories';
import {AppPostsComponent} from '../components/posts';

@Page({
  name: 'app-page-home',
  components: [AppCategoriesComponent, AppPostsComponent],
})
export class AppPageHome extends TiniComponent implements OnInit {
  @Inject() readonly categoryContentService!: ContentService<Category>;
  @Inject() readonly postContentService!: ContentService<Post>;
  @Inject() readonly tagContentService!: ContentService<Tag>;

  @Reactive() categories: RenderData<Category[]>;
  @Reactive() posts: RenderData<Post[]>;

  async onInit() {
    try {
      this.categories = await this.categoryContentService.list();
    } catch (error) {
      this.categories = [];
    }
    try {
      this.posts = await this.postContentService.list();
    } catch (error) {
      this.posts = [];
    }
  }

  protected render() {
    return html`
      <div>
        <main>
          <app-posts .posts=${this.posts}></app-posts>
        </main>

        <aside>
          <section>
            <h2>Categories</h2>
            <div>
              <app-categories .categories=${this.categories}></app-categories>
            </div>
          </section>
        </aside>
      </div>
    `;
  }
}
