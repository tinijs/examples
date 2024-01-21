import {html, css} from 'lit';
import {ref, Ref, createRef} from 'lit/directives/ref';
import {nanoid} from 'nanoid';

import {Page, TiniComponent, Inject, OnInit, OnReady} from '@tinijs/core';
import {UseParams, OnBeforeEnter} from '@tinijs/router';
import {Subscribe} from '@tinijs/store';

import {Friend} from '../types/user';
import {Thread, MessageWithContext} from '../types/thread';

import {ChunkData, renderChunk} from '../helpers/render';
import {promisifyStream} from '../helpers/gun';

import {AuthService} from '../services/auth';
import {FriendsService} from '../services/friends';
import {ThreadsService} from '../services/threads';
import {MessagesService} from '../services/messages';

import {meStore, streamCurrentUser} from '../stores/me';
import {messagesStore, streamUserByUserId} from '../stores/messages';

import {AppMessagesComponent} from '../components/messages';
import {AppComposeComponent} from '../components/compose';

import {loadingPartial} from '../partials/loading';
import {invalidUserPartial} from '../partials/invalid-user';
import {noMessagePartial} from '../partials/no-message';

@Page({
  name: 'app-page-thread',
  components: [AppMessagesComponent, AppComposeComponent],
})
export class AppPageThread
  extends TiniComponent
  implements OnBeforeEnter, OnInit, OnReady
{
  @Inject() private readonly authService!: AuthService;
  @Inject() private readonly friendsService!: FriendsService;
  @Inject() private readonly threadsService!: ThreadsService;
  @Inject() private readonly messagesService!: MessagesService;
  @UseParams() private readonly params!: {id: string};

  @Subscribe(meStore, 'user') currentUser = meStore.user;
  @Subscribe(messagesStore) cachedByUserIds = messagesStore.cachedByUserIds;

  private messagesContainerRef: Ref<HTMLElement> = createRef();
  private friend: ChunkData<Friend>;
  private thread: ChunkData<Thread>;

  onBeforeEnter() {
    return meStore.auth.is ? null : `/login?path=${location.pathname}`;
  }

  async onInit() {
    streamCurrentUser(this.authService);
    const {friend, thread} = await this.loadData();
    this.friend = friend;
    this.thread = thread;
  }

  onReady() {
    this.scrollToBottom();
  }

  private get messages() {
    const result = Array.from(
      this.cachedByUserIds.get(this.params.id)?.values() || []
    ).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return result;
  }

  private async loadData() {
    // get the friend or add a new one
    let friend: Friend | null = null;
    try {
      const currentFriend = await promisifyStream(
        this.friendsService.streamByUserId.bind(this.friendsService),
        this.params.id
      );
      friend =
        currentFriend || (await this.friendsService.addFriend(this.params.id));
    } catch (error) {
      // invalid user
    }

    // load thread and messages
    let thread: Thread | null = null;
    if (friend) {
      thread = await promisifyStream(
        this.threadsService.streamByUserId.bind(this.threadsService),
        friend.profile.id
      );
      this.streamMessages(friend);
    }

    // result
    return {friend, thread};
  }

  private streamMessages(friend: Friend) {
    if (!this.currentUser) return;
    streamUserByUserId(friend, this.currentUser, this.messagesService, () => {
      // console.log('new message ->', message);
      this.scrollToBottom();
    });
  }

  private async sendMessage(content: string) {
    if (!this.friend) return;
    // init new thread
    if (!this.thread) {
      const newThreadId = await this.threadsService.createThread(
        this.friend.profile.id,
        content
      );
      this.thread = await promisifyStream(
        this.threadsService.streamByThreadId.bind(this.threadsService),
        newThreadId
      );
      this.streamMessages(this.friend);
    }
    // send message
    const newMessage: MessageWithContext = {
      id: nanoid(),
      content,
      createdAt: new Date().toISOString(),
    };
    return this.messagesService.sendMessage(
      this.friend!.profile.id,
      newMessage.id,
      content
    );
  }

  private scrollToBottom(instantly = false) {
    if (!this.messagesContainerRef.value) return;
    const container = this.messagesContainerRef.value;
    setTimeout(
      () => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      },
      instantly ? 0 : 300
    );
  }

  protected render() {
    return renderChunk(this.cachedByUserIds.get(this.params.id), {
      loading: loadingPartial,
      empty: invalidUserPartial,
      main: () => this.mainTemplate,
    });
  }

  private get mainTemplate() {
    return html`
      <section
        ${ref(this.messagesContainerRef)}
        class="message-container"
        style="
          margin: auto;
          box-sizing: border-box;
          max-width: var(--wide-sm);
          padding: var(--size-space);
          height: calc(100vh - var(--header-height) - 56px);
          height: calc(100dvh - var(--header-height) - 56px);
          overflow-x: hidden;
          overflow-y: scroll;
        "
      >
        ${!this.messages.length
          ? noMessagePartial()
          : html` <app-messages .messages=${this.messages}></app-messages> `}
      </section>
      <section
        style="
          box-sizing: border-box;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: var(--compose-height);
          padding: var(--size-space-0_5x);
          padding-left: var(--size-space);
          background: var(--color-background);
        "
      >
        <app-compose
          style="
            display: block;
            margin: auto;
            width: 100%;
            max-width: var(--wide-sm);
          "
          @commit=${(e: CustomEvent<string>) => this.sendMessage(e.detail)}
        ></app-compose>
      </section>
    `;
  }

  static styles = css`
    .message-container {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .message-container::-webkit-scrollbar {
      display: none;
    }
  `;
}
