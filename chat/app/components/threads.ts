import {html, nothing} from 'lit';
import {repeat} from 'lit/directives/repeat';
import {styleMap} from 'lit/directives/style-map';

import * as dayjs from 'dayjs';

import {
  Component,
  TiniComponent,
  Input,
  Output,
  EventEmitter,
} from '@tinijs/core';
import {User} from '@tinijs/toolbox/gun';

import {Thread} from '../types/thread';

@Component()
export class AppThreadsComponent extends TiniComponent {
  static readonly defaultTagName = 'app-threads';

  @Input() currentUser?: User;
  @Input() threads?: Thread[];
  @Output() clickThread!: EventEmitter<Thread>;

  private formatDate(date: string) {
    return dayjs(date).format('MMM D');
  }

  protected render() {
    return !this.threads
      ? nothing
      : html`
          <div
            style="
              display: flex;
              flex-flow: column;
              gap: var(--size-space-1_5x);
            "
          >
            ${repeat(
              this.threads,
              item => item.id,
              item => html`
                <div
                  style="
                    display: flex;
                    align-items: center;
                    gap: var(--size-space);
                    cursor: pointer;
                  "
                  @click=${() => this.clickThread.emit(item)}
                >
                  <img
                    src="${item.friend.profile.avatar}"
                    alt="${item.friend.profile.name}"
                    width="48"
                    height="48"
                    style="border-radius: 50%"
                  />
                  <div style="width: calc(100% - 48px - var(--size-space))">
                    <span
                      >${this.currentUser?.id === item.friend.profile.id
                        ? 'Your Notes'
                        : item.friend.profile.name}</span
                    >
                    <div
                      style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        line-height: 1;
                        gap: var(--size-space);
                      "
                    >
                      <span
                        style="
                          display: block;
                          width: 80%;
                          font-size: var(--size-text-0_9x);
                          color: var(--color-medium);
                          white-space: nowrap;
                          overflow: hidden;
                          text-overflow: ellipsis;
                        "
                        ><span
                          style=${styleMap({
                            fontWeight: item.latestMine ? 'normal' : 'bold',
                          })}
                          >${item.latestContent}</span
                        ></span
                      >
                      <span
                        style="
                          font-size: var(--size-text-0_9x);
                          color: var(--color-medium);
                          text-align: right;
                        "
                        >${this.formatDate(item.latestAt)}</span
                      >
                    </div>
                  </div>
                </div>
              `
            )}
          </div>
        `;
  }
}
