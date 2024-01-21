import {html} from 'lit';

import {
  App,
  TiniComponent,
  AppWithConfigs,
  OnCreate,
  registerConfigs,
} from '@tinijs/core';
import {createRouter, AppWithRouter} from '@tinijs/router';
import {initMeta, AppWithMeta} from '@tinijs/meta';

import {TiniGenericComponent} from '@tinijs/ui/components/generic';
import {TiniGenericUnscopedComponent} from '@tinijs/ui/components/generic-unscoped';
import {TiniBoxComponent} from '@tinijs/ui/components/box';
import {TiniTextComponent} from '@tinijs/ui/components/text';
import {TiniLinkComponent} from '@tinijs/ui/components/link';
import {TiniButtonComponent} from '@tinijs/ui/components/button';

import {AppConfigs} from './types/common';

import {initSentry} from './helpers/sentry';

import configs from './configs/development';
import providers from './providers';
import metas from './metas';
import routes from './routes';

import './layouts/default';

@App({
  providers,
  components: [
    TiniGenericComponent,
    TiniGenericUnscopedComponent,
    TiniBoxComponent,
    TiniTextComponent,
    TiniLinkComponent,
    TiniButtonComponent,
  ],
})
export class AppRoot
  extends TiniComponent
  implements AppWithConfigs<AppConfigs>, AppWithRouter, AppWithMeta, OnCreate
{
  readonly configs = registerConfigs(configs);
  readonly router = createRouter(routes, {linkTrigger: true});
  readonly meta = initMeta({
    metas,
    autoPageMetas: true,
  });

  onCreate() {
    initSentry(this.configs.sentryDSN);
  }

  protected render() {
    return html`<router-outlet .router=${this.router}></router-outlet>`;
  }
}
