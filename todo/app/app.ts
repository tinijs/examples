import {html} from 'lit';

import {App, TiniComponent} from '@tinijs/core';
import {createRouter} from '@tinijs/router';

import {TiniGenericComponent} from '@tinijs/ui/components/generic';
import {TiniLinkComponent} from '@tinijs/ui/components/link';

import routes from './routes';

import './layouts/default';

@App({
  components: [TiniGenericComponent, TiniLinkComponent],
})
export class AppRoot extends TiniComponent {
  readonly router = createRouter(routes, {linkTrigger: true});

  protected render() {
    return html`<router-outlet .router=${this.router}></router-outlet>`;
  }
}
