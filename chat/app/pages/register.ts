import {html} from 'lit';
import {ref, Ref, createRef} from 'lit/directives/ref';

import {Colors, CommonColors, CommonGradients} from 'tinijs';
import {Page, TiniComponent, Reactive, Inject} from '@tinijs/core';
import {UseRouter, Router, OnBeforeEnter} from '@tinijs/router';

import {TiniInputComponent} from '@tinijs/ui/components/input';
import {TiniMessageComponent} from '@tinijs/ui/components/message';
import {TiniDialogComponent} from '@tinijs/ui/components/dialog';

import {randomPhoto} from '../helpers/photo';

import {AuthService} from '../services/auth';

import {meStore} from '../stores/me';

@Page({
  name: 'app-page-register',
  components: [TiniInputComponent, TiniMessageComponent, TiniDialogComponent],
})
export class AppPageRegister extends TiniComponent implements OnBeforeEnter {
  @Inject() private readonly authService!: AuthService;
  @UseRouter() private readonly router!: Router;

  @Reactive() lockdown = false;

  private dialogRef: Ref<TiniDialogComponent> = createRef();
  private username = '';
  private password = '';
  private passwordAgain = '';

  onBeforeEnter() {
    return !meStore.auth.is ? null : '/';
  }

  private showDialog(title: string, content: string) {
    this.dialogRef.value!.titleText = title;
    this.dialogRef.value!.textContent = content;
    return this.dialogRef.value!.show();
  }

  private async register() {
    if (
      !this.username ||
      !this.password ||
      this.password !== this.passwordAgain
    ) {
      return this.showDialog('Invalid', 'Please enter valid credentials!');
    }
    this.lockdown = true;
    try {
      const avatar = await randomPhoto();
      await this.authService.createUser(this.username, this.password, {
        avatar,
      });
      location.href = '/';
    } catch (error: any) {
      this.showDialog('Error', error.message);
    }
    this.lockdown = false;
  }

  private keypress(e: CustomEvent<KeyboardEvent>) {
    if (e.detail.key !== 'Enter') return;
    this.register();
  }

  protected render() {
    return html`
      <tini-box
        padding="1x 2x 2x"
        style="margin: auto; max-width: var(--wide-ss)"
      >
        <tini-message scheme="${Colors.DangerSubtle}"
          >Demo app! Please DON'T use real credentials.</tini-message
        >

        <tini-text tag="h3" color=${CommonGradients.DiscoClub}
          >Create an account</tini-text
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
            placeholder="Example: John, Jane Doe, Max 123, ..."
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
          <tini-input
            wrap
            block
            focus:scheme=${CommonColors.Blue}
            label="Password again"
            placeholder="Repeat password"
            type="password"
            events="input,keypress"
            ?disabled=${this.lockdown}
            @input=${(e: CustomEvent<InputEvent>) =>
              (this.passwordAgain = (
                e.detail.target as HTMLInputElement
              ).value)}
            @keypress=${this.keypress}
          ></tini-input>
        </div>

        <tini-button
          style="margin-top: var(--size-space-3x)"
          block
          scheme=${CommonGradients.DiscoClub}
          ?disabled=${this.lockdown}
          @click=${this.register}
          >Create account</tini-button
        >
        <tini-text tag="p"
          >Already have an account, please
          <tini-link href="/login" color=${CommonGradients.DiscoClub}
            >sign in</tini-link
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
