import {html} from 'lit';
import {ref, Ref, createRef} from 'lit/directives/ref';

import {CommonColors, CommonGradients} from 'tinijs';
import {Page, TiniComponent, Reactive, Inject} from '@tinijs/core';
import {UseRouter, Router, OnBeforeEnter} from '@tinijs/router';

import {TiniInputComponent} from '@tinijs/ui/components/input';
import {TiniDialogComponent} from '@tinijs/ui/components/dialog';

import {AuthService} from '../services/auth';

import {meStore} from '../stores/me';

@Page({
  name: 'app-page-login',
  components: [TiniInputComponent, TiniDialogComponent],
})
export class AppPageLogin extends TiniComponent implements OnBeforeEnter {
  @Inject() private readonly authService!: AuthService;
  @UseRouter() private readonly router!: Router;

  @Reactive() lockdown = false;

  private dialogRef: Ref<TiniDialogComponent> = createRef();
  private username = '';
  private password = '';

  onBeforeEnter() {
    return !meStore.auth.is ? null : '/';
  }

  private showDialog(title: string, content: string) {
    this.dialogRef.value!.titleText = title;
    this.dialogRef.value!.textContent = content;
    return this.dialogRef.value!.show();
  }

  private async login() {
    if (!this.username || !this.password) {
      return this.showDialog('Invalid', 'Please enter valid credentials!');
    }
    this.lockdown = true;
    try {
      await this.authService.signIn(this.username, this.password);
      const forwardPath = this.router
        .getActiveRoute()
        .url.searchParams.get('path');
      location.href = forwardPath || '/';
    } catch (error: any) {
      this.showDialog('Error', error.message);
    }
    this.lockdown = false;
  }

  private keypress(e: CustomEvent<KeyboardEvent>) {
    if (e.detail.key !== 'Enter') return;
    this.login();
  }

  protected render() {
    return html`
      <tini-box
        padding="0x 2x 2x"
        style="margin: auto; max-width: var(--wide-ss)"
      >
        <tini-text tag="h3" color=${CommonGradients.DiscoClub}
          >Sign in</tini-text
        >
        <div
          style="
            display: flex;
            flex-flow: column;
            gap: var(--size-space);
          "
        >
          <tini-input
            wrap
            block
            focus:scheme=${CommonColors.Blue}
            label="Username"
            placeholder="Enter username"
            events="input,keypress"
            ?disabled=${this.lockdown}
            @input=${(e: CustomEvent<InputEvent>) =>
              (this.username = (e.detail.target as HTMLInputElement).value)}
            @keypress=${this.keypress}
          ></tini-input>
          <tini-input
            wrap
            block
            focus:scheme=${CommonColors.Blue}
            label="Password"
            placeholder="Enter password"
            type="password"
            events="input,keypress"
            ?disabled=${this.lockdown}
            @input=${(e: CustomEvent<InputEvent>) =>
              (this.password = (e.detail.target as HTMLInputElement).value)}
            @keypress=${this.keypress}
          ></tini-input>
        </div>

        <tini-button
          style="margin-top: var(--size-space-3x)"
          block
          scheme=${CommonGradients.DiscoClub}
          ?disabled=${this.lockdown}
          @click=${this.login}
          >Sign me in</tini-button
        >
        <tini-text tag="p"
          >Don't have an account, please
          <tini-link href="/register" color=${CommonGradients.DiscoClub}
            >create one</tini-link
          >?</tini-text
        >
      </tini-box>

      <tini-dialog
        ${ref(this.dialogRef)}
        .yesButton=${{scheme: CommonGradients.DiscoClub}}
        @yes=${() => this.dialogRef.value!.hide()}
        @no=${() => this.dialogRef.value!.hide()}
      ></tini-dialog>
    `;
  }
}
