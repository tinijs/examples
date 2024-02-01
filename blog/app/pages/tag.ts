import {html} from 'lit';

import {Page, TiniComponent} from '@tinijs/core';

@Page({
  name: 'app-page-tag',
})
export class AppPageTag extends TiniComponent {
  protected render() {
    return html`<p>AppPageTag</p>`;
  }
}
