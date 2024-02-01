import {html, nothing} from 'lit';
import {unsafeHTML} from 'lit/directives/unsafe-html';

import {
  Page,
  TiniComponent,
  Inject,
  OnInit,
  Reactive,
  render,
  RenderData,
} from '@tinijs/core';
import {UseParams} from '@tinijs/router';
import {ContentService} from '@tinijs/toolbox/content';

import {Page as ContentPage} from '../consts/page-content';

import {oopsPartial} from '../partials/oops';

@Page({
  name: 'app-page-page',
})
export class AppPagePage extends TiniComponent implements OnInit {
  @Inject() readonly pageContentService!: ContentService<ContentPage>;
  @UseParams() readonly params!: {slug: string};

  @Reactive() page: RenderData<ContentPage>;

  async onInit() {
    try {
      this.page = await this.pageContentService.getBySlug(this.params.slug);
    } catch (error) {
      this.page = null;
    }
  }

  protected render() {
    return render([this.page], {
      empty: () => this.notFoundTemplate,
      main: () => this.mainTemplate,
    });
  }

  private get notFoundTemplate() {
    return oopsPartial({
      message: html`Page not found: <strong>${this.params.slug}</strong>`,
    });
  }

  private get mainTemplate() {
    return !this.page
      ? nothing
      : html`
          <article>
            <div><img src=${this.page.image} /></div>
            <h2>${this.page.title}</h2>
            <div>${unsafeHTML(this.page.content)}</div>
          </article>
        `;
  }
}
