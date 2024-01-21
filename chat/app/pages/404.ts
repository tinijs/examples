import {html} from 'lit';

import {Page, TiniComponent} from '@tinijs/core';
import {PageWithMetas, PageMetas} from '@tinijs/meta';

@Page({
  name: 'app-page-404',
})
export class AppPage404 extends TiniComponent implements PageWithMetas {
  readonly metas: PageMetas = {
    title: 'Oops',
    description: 'Error 404, page not found!',
  };

  protected render() {
    return html`
      <div style="text-align: center; padding: 2rem">
        <h1>Oops 🫣</h1>
        <p>The content you are looking for is not available any more!</p>
      </div>
    `;
  }
}
