import {html} from 'lit';

import {THEME_CHANGE_EVENT, ActiveTheme, CommonGradients, Scales} from 'tinijs';
import {
  Component,
  TiniComponent,
  OnCreate,
  OnDestroy,
  Reactive,
} from '@tinijs/core';

import {IconGithubComponent} from '@tinijs/mdi-icons/github';
import {IconTooltipCheckComponent} from '@tinijs/mdi-icons/tooltip-check';
import {
  TiniSwitchComponent,
  SwitchEventDetail,
} from '@tinijs/ui/components/switch';

import {Themes, initTheme, changeTheme} from '../helpers/theme';

@Component({
  components: [
    IconGithubComponent,
    IconTooltipCheckComponent,
    TiniSwitchComponent,
  ],
})
export class AppHeaderComponent
  extends TiniComponent
  implements OnCreate, OnDestroy
{
  static readonly defaultTagName = 'app-header';

  @Reactive() private themeId = initTheme();

  private themeChangeHandler = (e: Event) =>
    (this.themeId = (e as CustomEvent<ActiveTheme>).detail.themeId);

  private toggleTheme(e: CustomEvent<SwitchEventDetail>) {
    return changeTheme(e.detail.checked ? Themes.Dark : Themes.Light);
  }

  onCreate() {
    addEventListener(THEME_CHANGE_EVENT, this.themeChangeHandler);
  }

  onDestroy() {
    removeEventListener(THEME_CHANGE_EVENT, this.themeChangeHandler);
  }

  protected render() {
    return html`
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--color-background);
          max-width: var(--wide-sm);
          padding: var(--size-space-0_75x) var(--size-space);
          margin: 0 auto;
        "
      >
        <div
          style="
            display: flex;
            align-items: center;
            gap: var(--size-space);
          "
        >
          <tini-link href="/" style="transform: translateY(5px)">
            <icon-tooltip-check
              scheme=${CommonGradients.KaleSalad}
              scale=${Scales.ML}
            ></icon-tooltip-check>
          </tini-link>
          <h1 style="font-size: 1.25rem; margin: 0">To Do</h1>
        </div>

        <div
          style="
            display: flex;
            align-items: center;
            gap: var(--size-space-1_25x);
          "
        >
          <a
            href="https://github.com/tinijs/examples/tree/main/todo"
            target="_blank"
            style="
              display: flex;
              align-items: center;
              justify-content: center;
              border: none;
              background: none;
              padding: var(--size-space-0_25x);
              cursor: pointer;
            "
          >
            <icon-github
              scheme=${CommonGradients.KaleSalad}
              scale=${Scales.MD}
            ></icon-github>
          </a>
          <tini-switch
            style="line-height: 1"
            scheme=${CommonGradients.KaleSalad}
            scale="ml"
            .checked=${this.themeId === Themes.Dark}
            @change=${this.toggleTheme}
          ></tini-switch>
        </div>
      </div>
    `;
  }
}
