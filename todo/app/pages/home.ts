import {html, css} from 'lit';
import {Page, TiniComponent} from '@tinijs/core';

import {AppWelcomeComponent} from '../components/welcome';

@Page({
  name: 'app-page-home',
  components: [AppWelcomeComponent],
})
export class AppPageHome extends TiniComponent {
  protected render() {
    return html`<app-welcome></app-welcome>`;
  }

  static styles = css`
    :host {
      text-align: center;
    }
  `;
}
