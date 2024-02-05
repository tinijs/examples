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
import {OnBeforeEnter} from '@tinijs/router';

import {CategoryLite, CategoryContentService} from '../consts/category-content';
import {TagContentService} from '../consts/tag-content';
import {PostLite, PostContentService} from '../consts/post-content';

import {AppCategoriesComponent} from '../components/categories';
import {AppPostsComponent} from '../components/posts';

@Page({
  name: 'app-page-home',
  components: [AppCategoriesComponent, AppPostsComponent],
})
export class AppPageHome
  extends TiniComponent
  implements OnInit, OnBeforeEnter
{
  @Inject() readonly categoryContentService!: CategoryContentService;
  @Inject() readonly tagContentService!: TagContentService;
  @Inject() readonly postContentService!: PostContentService;

  @Reactive() categories: RenderData<CategoryLite[]>;
  @Reactive() posts: RenderData<PostLite[]>;

  onBeforeEnter(...params: any[]) {
    console.log('Home: ', this, params);
  }

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

        <a href="/post/a-sample-post#section-header">Test link</a>
      </div>
    `;
  }
}
