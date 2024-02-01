import {html} from 'lit';

import {
  App,
  TiniComponent,
  AppWithConfigs,
  registerConfigs,
} from '@tinijs/core';
import {createRouter, AppWithRouter} from '@tinijs/router';
import {initMeta, AppWithMeta} from '@tinijs/meta';

import {AppConfigs} from './types/common';

import configs from './configs/development';
import providers from './providers';
import routes from './routes';
import metas from './metas';

import './layouts/default';

@App({providers})
export class AppRoot
  extends TiniComponent
  implements AppWithConfigs<AppConfigs>, AppWithRouter, AppWithMeta
{
  readonly configs = registerConfigs(configs);
  readonly router = createRouter(routes, {linkTrigger: true});
  readonly meta = initMeta({
    metas,
    autoPageMetas: true,
  });

  protected render() {
    return html`<router-outlet .router=${this.router}></router-outlet>`;
  }
}
