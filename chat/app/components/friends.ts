import {html, nothing} from 'lit';
import {repeat} from 'lit/directives/repeat';

import {
  Component,
  TiniComponent,
  Input,
  Output,
  EventEmitter,
} from '@tinijs/core';

import {User} from '../types/user';

@Component()
export class AppFriendsComponent extends TiniComponent {
  static readonly defaultTagName = 'app-friends';

  @Input() currentUser?: User;
  @Input() users?: User[];
  @Output() clickUser!: EventEmitter<User>;

  private displayName(username: string) {
    const name = username.split(' ')[0];
    return name.length > 6 ? name.slice(0, 6) : name;
  }

  protected render() {
    return !this.users?.length
      ? nothing
      : html`
          <div
            style="
              display: flex;
              align-items: center;
              gap: var(--size-space-1_5x);
            "
          >
            ${repeat(
              this.users,
              item => item.id,
              item => html`
                <div
                  style="
                    display: flex;
                    flex-flow: column;
                    align-items: center;
                    gap: var(--size-space-0_5x);
                    cursor: pointer;
                  "
                  @click=${() => this.clickUser.emit(item)}
                >
                  <img
                    src="${item.avatar}"
                    alt="${item.username}"
                    width="60"
                    height="60"
                    style="border-radius: 50%"
                  />
                  <div>
                    <span
                      >${this.currentUser?.id === item.id
                        ? 'You'
                        : this.displayName(item.name)}</span
                    >
                  </div>
                </div>
              `
            )}
          </div>
        `;
  }
}