import {html, nothing, TemplateResult} from 'lit';
import {DateTime} from 'luxon';

import {
  Component,
  TiniComponent,
  Input,
  render,
  RenderData,
} from '@tinijs/core';
import {DenormList} from '@tinijs/toolbox/schema';
import {parseDenormList} from '@tinijs/toolbox/content';

import {Post} from '../consts/post-content';

@Component()
export class AppPostsComponent extends TiniComponent {
  static readonly defaultTagName = 'app-posts';

  @Input() posts: RenderData<Post[]>;

  protected render() {
    return render([this.posts], {
      loading: () => this.loadingTemplate,
      empty: () => this.emptyTemplate,
      main: () => this.mainTemplate,
    });
  }

  private get loadingTemplate() {
    return html`<p>Loading...</p>`;
  }

  private get emptyTemplate() {
    return html`<p>No post</p>`;
  }

  private get mainTemplate() {
    return !this.posts?.length
      ? nothing
      : html`
          <ul>
            ${this.posts.map(
              post => html`
                <li>
                  <a href="/post/${post.slug}">
                    <img src="${post.thumbnail}" alt="${post.title}" />
                    <h3>${post.title}</h3>
                  </a>
                  <p>${this.constructPostInfo(post)}</p>
                  <p>${post.excerpt}</p>
                </li>
              `
            )}
          </ul>
        `;
  }

  private constructPostInfo(post: Post) {
    const result = [] as TemplateResult[];
    // date
    if (post.created) {
      result.push(
        html`<a href="/post/${post.slug}"
          >${DateTime.fromISO(post.created).toLocaleString(
            DateTime.DATE_MED
          )}</a
        >`
      );
    }
    // authors
    if (post.authors.length) {
      result.push(this.createLinksGroup(post.authors, 'author', '—', 'name'));
    }
    // categories
    if (post.categories.length) {
      result.push(this.createLinksGroup(post.categories, 'category', 'in'));
    }
    // result
    return result;
  }

  private createLinksGroup(
    denormItems: DenormList<any>,
    path: string,
    leadingText: string,
    fieldName = 'title'
  ) {
    const items = parseDenormList(denormItems.slice(0, 3), fieldName); // limit to 3 items
    return html`
      <span>
        <span> ${leadingText} </span>
        ${items.map(
          ({slug, [fieldName]: title}, i) =>
            html`<a href="/${path}/${slug}">${title}</a>${i < items.length - 1
                ? html`<span>, </span>`
                : nothing}`
        )}
      </span>
    `;
  }
}
