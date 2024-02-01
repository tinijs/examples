import {html} from 'lit';

import {Page, TiniComponent} from '@tinijs/core';

@Page({
  name: 'app-page-post',
})
export class AppPagePost extends TiniComponent {
  protected render() {
    return html`<p>AppPagePost</p>`;
  }
}
