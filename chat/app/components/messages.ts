import {html, nothing} from 'lit';
import {repeat} from 'lit/directives/repeat';

import {Colors, CommonGradients} from 'tinijs';
import {Component, TiniComponent, Input} from '@tinijs/core';

import {MessageWithContext} from '../types/thread';

@Component()
export class AppMessagesComponent extends TiniComponent {
  static readonly defaultTagName = 'app-messages';

  @Input() messages?: MessageWithContext[];

  protected render() {
    return !this.messages
      ? nothing
      : html`
          <div
            style="
              display: flex;
              flex-direction: column;
              gap: var(--size-space-2x);
            "
          >
            ${repeat(
              this.messages,
              item => item.id,
              item =>
                !item.sender
                  ? html`
                      <div
                        style="
                          padding-left: calc(var(--size-space) * 2.75);
                          display: flex;
                          justify-content: flex-end;
                        "
                      >
                        <tini-box
                          scheme=${CommonGradients.DiscoClub}
                          padding="0_5x"
                          styleDeep="
                            :host, .root {
                              display: inline-block;
                            }
                          "
                          >${item.content}</tini-box
                        >
                      </div>
                    `
                  : html`
                      <div
                        style="
                          display: flex;
                          gap: var(--size-space-0_75x);
                          padding-right: var(--size-space-2x);
                        "
                      >
                        <div>
                          <img
                            src=${item.sender.profile.avatar}
                            alt=${item.sender.profile.username}
                            width="32"
                            height="32"
                            style="border-radius: 50%"
                          />
                        </div>
                        <div>
                          <tini-box
                            scheme=${Colors.BackgroundTint}
                            padding="0_5x"
                            shadow="normal"
                            >${item.content}</tini-box
                          >
                        </div>
                      </div>
                    `
            )}
          </div>
        `;
  }
}
