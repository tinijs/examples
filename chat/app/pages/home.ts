import {html} from 'lit';

import {Colors} from 'tinijs';
import {Page, TiniComponent, OnInit, Inject, render} from '@tinijs/core';
import {UseRouter, Router, OnBeforeEnter} from '@tinijs/router';
import {Subscribe} from '@tinijs/store';
import {AuthService, User} from '@tinijs/toolbox/gun';

import {Thread} from '../types/thread';

import {FriendService} from '../services/friend';
import {ThreadService} from '../services/thread';

import {meStore, streamCurrentUser} from '../stores/me';
import {friendsStore, streamFriendList} from '../stores/friends';
import {threadsStore, streamThreadList} from '../stores/threads';

import {AppFriendsComponent} from '../components/friends';
import {AppThreadsComponent} from '../components/threads';

import {loadingPartial} from '../partials/loading';
import {noMessagePartial} from '../partials/no-message';

@Page({
  name: 'app-page-home',
  components: [AppFriendsComponent, AppThreadsComponent],
})
export class AppPageHome
  extends TiniComponent
  implements OnBeforeEnter, OnInit
{
  @Inject() private readonly authService!: AuthService;
  @Inject() private readonly friendService!: FriendService;
  @Inject() private readonly threadService!: ThreadService;
  @UseRouter() private readonly router!: Router;

  @Subscribe(meStore, 'user') private currentUser = meStore.user;
  @Subscribe(friendsStore, 'list') private friendList = friendsStore.list;
  @Subscribe(threadsStore, 'list') private threadList = threadsStore.list;

  onBeforeEnter() {
    return meStore.auth.is ? null : '/login';
  }

  async onInit() {
    streamCurrentUser(this.authService);
    streamFriendList(this.friendService);
    streamThreadList(this.threadService);

    // const x = await this.friendService.getList();
    // console.log(x);
  }

  onChanges() {
    // console.log('currentUser -> ', this.currentUser);
    console.log('friendList -> ', this.friendList);
  }

  private get friends() {
    console.log('friends', this.friendList);
    // const result: User[] = Array.from(this.friendList?.values() || [])
    //   .map(item => item.profile)
    //   .filter(item => item.id !== this.authService.userId)
    //   .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    // if (this.currentUser) result.unshift(this.currentUser);
    return [];
  }

  private get threads() {
    const result = Array.from(this.threadList?.values() || []).sort(
      (a, b) =>
        [this.authService.userId].indexOf(b.friend.profile.id) -
          [this.authService.userId].indexOf(a.friend.profile.id) ||
        b.latestAt.localeCompare(a.latestAt)
    );
    return result;
  }

  private clickUser(e: CustomEvent<User>) {
    this.router.go(`/profile/${e.detail.alias}`);
  }

  private clickThread(e: CustomEvent<Thread>) {
    this.router.go(`/thread/${e.detail.friend.profile.id}`);
  }

  protected render() {
    return html`
      <tini-box padding="1x 2x" style="max-width: var(--wide-sm); margin: auto">
        <tini-box
          scheme=${Colors.BackgroundTint}
          padding="1_5x 1x 1x"
          borderRadius="massive"
          style="
            display: flex;
            justify-content: center;
            gap: 2rem;
          "
        >
          ${render([this.friendList], {
            loading: loadingPartial,
            empty: () => html`
              <app-friends
                .currentUser=${this.currentUser}
                .users=${[this.currentUser]}
                @clickUser=${this.clickUser}
              ></app-friends>
            `,
            main: () => html`
              <app-friends
                .currentUser=${this.currentUser}
                .users=${this.friends}
                @clickUser=${this.clickUser}
              ></app-friends>
            `,
          })}
        </tini-box>

        <section style="margin-top: var(--size-space-2x)">
          ${render([this.threadList], {
            loading: loadingPartial,
            empty: () =>
              noMessagePartial({
                message: html`Start adding friend and having some chats.
                  <br />Your chats appear here!`,
              }),
            main: () => html`
              <app-threads
                .currentUser=${this.currentUser}
                .threads=${this.threads}
                @clickThread=${this.clickThread}
              ></app-threads>
            `,
          })}
        </section>
      </tini-box>
    `;
  }
}
