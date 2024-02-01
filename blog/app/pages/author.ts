import {html, css} from 'lit';

import {Page, TiniComponent} from '@tinijs/core';

@Page({
  name: 'app-page-author',
})
export class AppPageAuthor extends TiniComponent {
  protected render() {
    return html`<p>AppPageAuthor</p>`;
  }

  static styles = css``;
}
