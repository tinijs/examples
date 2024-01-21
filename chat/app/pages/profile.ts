import {html, nothing} from 'lit';
import {classMap} from 'lit/directives/class-map';
import {styleMap} from 'lit/directives/style-map';
import {ref, Ref, createRef} from 'lit/directives/ref';

import {Colors, CommonGradients} from 'tinijs';
import {
  Page,
  Component,
  TiniComponent,
  Reactive,
  OnInit,
  Inject,
  Input,
  Output,
  EventEmitter,
} from '@tinijs/core';
import {UseRouter, UseParams, Router} from '@tinijs/router';
import {Subscribe} from '@tinijs/store';

import {TiniDialogComponent} from '@tinijs/ui/components/dialog';

import {User} from '../types/user';

import {renderChunk} from '../helpers/render';
import {randomPhoto} from '../helpers/photo';
import {createQRCode} from '../helpers/qr';
import {share} from '../helpers/share';

import {AuthService} from '../services/auth';
import {UsersService} from '../services/users';

import {meStore, streamCurrentUser} from '../stores/me';
import {usersStore, streamUserByUsername} from '../stores/users';

import {loadingPartial} from '../partials/loading';
import {invalidUserPartial} from '../partials/invalid-user';

@Component({
  components: [TiniDialogComponent],
})
class AppPageProfileAvatarComponent extends TiniComponent {
  static readonly defaultTagName = 'app-page-profile-avatar';

  @Input() user?: User;
  @Output() change!: EventEmitter<string>;

  @Reactive() showQRCode = false;
  @Reactive() newUrl?: string;
  @Reactive() loadingNewUrl = false;

  private avatarDialogRef: Ref<TiniDialogComponent> = createRef();
  private qrContainerRef: Ref<HTMLElement> = createRef();
  private qrCode?: ReturnType<typeof createQRCode>;

  showChangeAvatarDialog() {
    this.avatarDialogRef.value!.show();
  }

  private get isNewUrlValid() {
    return this.newUrl && !this.loadingNewUrl;
  }

  private toggleQRCode() {
    if (!this.qrContainerRef.value) return;
    if (!this.qrCode) {
      const url = new URL(location.href);
      this.qrCode = createQRCode(
        this.qrContainerRef.value,
        `${url.origin}${url.pathname}`
      );
    }
    setTimeout(() => (this.showQRCode = !this.showQRCode), 0);
  }

  private changeAvatar() {
    if (!this.isNewUrlValid) return;
    if (this.newUrl && this.newUrl !== this.user?.avatar) {
      this.change.emit(this.newUrl);
    }
    this.showQRCode = false;
    this.avatarDialogRef.value!.hide();
  }

  private async randomPhoto() {
    if (this.loadingNewUrl) return;
    try {
      this.loadingNewUrl = true;
      this.newUrl = await randomPhoto();
    } catch (error) {
      alert('Failed to load new photo, please retry!');
    } finally {
      setTimeout(() => (this.loadingNewUrl = false), 1500);
    }
  }

  protected render() {
    return html` ${this.mainTemplate} ${this.changeAvatarDialogTemplate} `;
  }

  private get mainTemplate() {
    return !this.user
      ? nothing
      : html`
          <div
            style="
          width: 300px;
          height: 300px;
          perspective: 1000px;
          background-color: transparent;
        "
            class=${classMap({'flip-back': this.showQRCode})}
            @click="${this.toggleQRCode}"
          >
            <tini-generic-unscoped
              styleDeep="
            .root {
              display: block;
              position: relative;
              width: 100%;
              height: 100%;
              transition: transform 0.8s;
              transform-style: preserve-3d;
              cursor: pointer;
            }
            .root > div {
              display: flex;
              align-items: center;
              justify-content: center;
              position: absolute;
              width: 100%;
              height: 100%;
              -webkit-backface-visibility: hidden;
              backface-visibility: hidden;
            }
            .flip-back .root {
              transform: rotateY(180deg);
            }
          "
            >
              <div>
                <img
                  .src=${this.user.avatar}
                  width="200"
                  height="200"
                  style="border-radius: 50%"
                />
              </div>
              <div style="transform: rotateY(180deg)">
                <div
                  ${ref(this.qrContainerRef)}
                  style="padding: 6px 6px 2px; background: white"
                ></div>
              </div>
            </tini-generic-unscoped>
          </div>
        `;
  }

  private get changeAvatarDialogTemplate() {
    return html`
      <tini-dialog
        ${ref(this.avatarDialogRef)}
        titleText="Choose a photo"
        @no=${() => this.avatarDialogRef.value!.hide()}
      >
        <div style="text-align: center">
          <div
            style=${styleMap({
              display: 'inline-block',
              maxWidth: '300px',
              maxHeight: '300px',
              textAlign: 'center',
              transition: 'opacity 0.5s ease-in-out',
              cursor: this.loadingNewUrl ? 'not-allowed' : 'pointer',
              opacity: this.loadingNewUrl ? '0.5' : '1',
            })}
            @click=${this.randomPhoto}
          >
            ${!this.newUrl && !this.user
              ? nothing
              : html`<img
                  src=${this.newUrl || this.user!.avatar}
                  style="width: 100%; height: auto"
                />`}
          </div>
          <p style="margin-bottom: 0">
            Click on the above image to re-generate.
          </p>
        </div>
        <div slot="foot" style="width: 100%">
          <tini-button
            block
            scheme=${CommonGradients.DiscoClub}
            ?disabled=${!this.isNewUrlValid}
            @click=${this.changeAvatar}
            >Use this photo</tini-button
          >
        </div>
      </tini-dialog>
    `;
  }
}

@Page({
  name: 'app-page-profile',
  components: [TiniDialogComponent, AppPageProfileAvatarComponent],
})
export class AppPageProfile extends TiniComponent implements OnInit {
  @Inject() private readonly authService!: AuthService;
  @Inject() private readonly usersService!: UsersService;
  @UseRouter() private readonly router!: Router;
  @UseParams() private readonly params!: {username: string};

  @Subscribe(usersStore, 'cachedByUsernames') users =
    usersStore.cachedByUsernames;
  @Subscribe(meStore, 'user') currentUser = meStore.user;

  private avatarRef: Ref<AppPageProfileAvatarComponent> = createRef();
  private logoutDialogRef: Ref<TiniDialogComponent> = createRef();

  async onInit() {
    streamUserByUsername(this.params.username, this.usersService);
    streamCurrentUser(this.authService);
  }

  private get profileUser() {
    return this.users.get(this.params.username);
  }

  private get isYours() {
    return !!(this.currentUser?.username === this.params.username);
  }

  private changeAvatar(e: CustomEvent<string>) {
    this.authService.updateProfile({avatar: e.detail});
  }

  private shareProfile() {
    if (!this.currentUser) return;
    return share({
      title: `I'm ${this.currentUser.name}!`,
      text: 'Send me a message on this cool chat app :)',
      url: location.href,
    });
  }

  private sendMessage() {
    if (!this.profileUser || this.isYours) return;
    return this.router.go(`/thread/${this.profileUser.id}`);
  }

  private sendSelfMessage() {
    if (!this.currentUser || !this.isYours) return;
    return this.router.go(`/thread/${this.currentUser.id}`);
  }

  private async logout() {
    this.authService.signOut();
    location.reload();
    this.logoutDialogRef.value!.hide();
  }

  protected render() {
    return renderChunk(this.profileUser, {
      loading: loadingPartial,
      empty: () => invalidUserPartial({message: 'Profile not found!'}),
      main: () => this.mainTemplate,
    });
  }

  private get mainTemplate() {
    return html`
      <div
        style="
          display: flex;
          flex-flow: column;
          align-items: center;
          padding: var(--size-space);
        "
      >
        <app-page-profile-avatar
          ${ref(this.avatarRef)}
          .user=${this.profileUser}
          @change=${this.changeAvatar}
        ></app-page-profile-avatar>

        <div
          style="
            width: 100%;
            display: flex;
            flex-flow: column;
            align-items: center;
          "
        >
          <tini-text tag="strong" fontSize="3x"
            >${this.profileUser!.username}</tini-text
          >
          <tini-text
            color=${Colors.Medium}
            style="text-align: center; padding: 0 2rem"
            >Click on the profile photo to reveal
            ${this.isYours ? 'your' : 'this user'} connect code.</tini-text
          >
          <div style="margin-top: 2rem">
            ${this.isYours
              ? html`
                  <div
                    style="
                      display: flex;
                      flex-flow: column;
                      align-items: center;
                    "
                  >
                    <div
                      style="
                        display: flex;
                        gap: 1rem;
                        margin-bottom: 1rem;
                      "
                    >
                      <tini-button
                        mode="outline"
                        scheme=${CommonGradients.AquaSpray}
                        @click=${this.sendSelfMessage}
                        >Send self notes</tini-button
                      >
                      <tini-button
                        scheme=${CommonGradients.DiscoClub}
                        @click=${this.shareProfile}
                        >Share your profile</tini-button
                      >
                    </div>
                    <p style="margin-top: 2rem">
                      <tini-link
                        href="#"
                        @click=${() =>
                          this.avatarRef.value!.showChangeAvatarDialog()}
                        color=${CommonGradients.DiscoClub}
                        >Change profile photo</tini-link
                      >
                      <span style="margin: 0 0.5rem"> &middot; </span>
                      <tini-link
                        href="#"
                        @click=${() => this.logoutDialogRef.value!.show()}
                        >Sign out</tini-link
                      >
                    </p>
                  </div>
                `
              : html`<tini-button
                  scheme=${CommonGradients.DiscoClub}
                  @click=${this.sendMessage}
                  >Send message</tini-button
                >`}
          </div>
        </div>
      </div>

      <tini-dialog
        ${ref(this.logoutDialogRef)}
        titleText="Sign out?"
        .yesButton=${{text: 'Sign out', scheme: CommonGradients.DiscoClub}}
        @yes=${this.logout}
        @no=${() => this.logoutDialogRef.value!.hide()}
      >
        <p>Do you want to sign out?</p>
      </tini-dialog>
    `;
  }
}
