import {html} from 'lit';

import {Page, TiniComponent} from '@tinijs/core';
import {PageWithMetas, PageMetas} from '@tinijs/meta';

import {oopsPartial} from '../partials/oops';

@Page({
  name: 'app-page-404',
})
export class AppPage404 extends TiniComponent implements PageWithMetas {
  readonly metas: PageMetas = {
    title: 'Oops',
    description: 'Error 404, page not found!',
  };

  protected render() {
    return oopsPartial();
  }
}
