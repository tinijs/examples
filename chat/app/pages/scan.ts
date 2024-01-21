import {
  Page,
  TiniComponent,
  OnCreate,
  OnFirstRender,
  OnDestroy,
} from '@tinijs/core';
import {UseRouter, Router} from '@tinijs/router';

import {Html5QrcodeScanner} from 'html5-qrcode';

import {createScanner} from '../helpers/qr';

@Page({
  name: 'app-page-scan',
})
export class AppPageScan
  extends TiniComponent
  implements OnCreate, OnFirstRender, OnDestroy
{
  private readonly CONTAINER_ID = 'qr-scanner';

  @UseRouter() private readonly router!: Router;

  private container?: HTMLElement;
  private scanner?: Html5QrcodeScanner;

  onCreate() {
    this.container = document.createElement('div');
    this.container.id = this.CONTAINER_ID;
    document.body.appendChild(this.container);
  }

  onFirstRender() {
    if (this.container) {
      const {width, height} = this.container.getBoundingClientRect();
      this.scanner = createScanner(
        {
          elementId: this.CONTAINER_ID,
          containerDimensions: [width, height],
        },
        result => this.handleResult(result)
      );
    }
  }

  onDestroy() {
    if (this.scanner) this.scanner.clear();
    if (this.container) document.body.removeChild(this.container);
  }

  private handleResult(result: string) {
    try {
      const url = new URL(result);
      if (url.origin === location.origin) {
        this.router.go(url.pathname);
      }
    } catch (error) {
      // ignore
    }
  }
}
