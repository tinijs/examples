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
import {OnBeforeEnter, UseParams} from '@tinijs/router';

import {Page as PageFull, PageContentService} from '../consts/page-content';

import {oopsPartial} from '../partials/oops';

@Page({
  name: 'app-page-page',
})
export class AppPagePage
  extends TiniComponent
  implements OnInit, OnBeforeEnter
{
  @Inject() readonly pageContentService!: PageContentService;
  @UseParams() readonly params!: {slug: string};

  @Reactive() page: RenderData<PageFull>;

  onBeforeEnter(...params: any[]) {
    console.log('Page: ', this, params);
  }

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
            <h1>${this.page.title}</h1>
            <div>${unsafeHTML(this.page.content)}</div>
          </article>
        `;
  }
}
