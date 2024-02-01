import {html, nothing} from 'lit';

import {
  Component,
  TiniComponent,
  Input,
  render,
  RenderData,
} from '@tinijs/core';

import {Category} from '../consts/category-content';

@Component()
export class AppCategoriesComponent extends TiniComponent {
  static readonly defaultTagName = 'app-categories';

  @Input() categories: RenderData<Category[]>;

  protected render() {
    return render([this.categories], {
      loading: () => this.loadingTemplate,
      empty: () => this.emptyTemplate,
      main: () => this.mainTemplate,
    });
  }

  private get loadingTemplate() {
    return html`<p>Loading...</p>`;
  }

  private get emptyTemplate() {
    return html`<p>No category</p>`;
  }

  private get mainTemplate() {
    return !this.categories?.length
      ? nothing
      : html`
          <ul>
            ${this.categories.map(
              category => html`
                <li>
                  <a href="/category/${category.slug}">
                    <img src="${category.thumbnail}" alt="${category.title}" />
                    <h3>${category.title}</h3>
                  </a>
                </li>
              `
            )}
          </ul>
        `;
  }
}
