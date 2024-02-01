import {html} from 'lit';

import {Page, TiniComponent} from '@tinijs/core';

@Page({
  name: 'app-page-category',
})
export class AppPageCategory extends TiniComponent {
  protected render() {
    return html`<p>AppPageCategory</p>`;
  }
}
