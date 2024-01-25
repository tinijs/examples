import {html} from 'lit';

import {THEME_CHANGE_EVENT, ActiveTheme, CommonGradients, Scales} from 'tinijs';
import {
  Component,
  TiniComponent,
  OnCreate,
  OnDestroy,
  Reactive,
} from '@tinijs/core';
import {initTheme, changeTheme} from '@tinijs/toolbox/app';

import {IconGithubComponent} from '@tinijs/mdi-icons/github';
import {IconTooltipCheckComponent} from '@tinijs/mdi-icons/tooltip-check';
import {
  TiniSwitchComponent,
  SwitchEventDetail,
} from '@tinijs/ui/components/switch';

export enum Themes {
  Light = 'bootstrap/light',
  Dark = 'bootstrap/dark',
}

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

  @Reactive() private themeId = Themes.Light;

  private themeChangeHandler = (e: Event) =>
    (this.themeId = (e as CustomEvent<ActiveTheme>).detail.themeId as Themes);

  private toggleTheme(e: CustomEvent<SwitchEventDetail>) {
    return changeTheme(e.detail.checked ? Themes.Dark : Themes.Light);
  }

  async onCreate() {
    addEventListener(THEME_CHANGE_EVENT, this.themeChangeHandler);
    this.themeId = await initTheme(Themes.Light) as Themes;
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
            gap: var(--size-space-1_5x);
          "
        >
          <tini-switch
            style="line-height: 1"
            scheme=${CommonGradients.KaleSalad}
            scale="ml"
            .checked=${this.themeId === Themes.Dark}
            @change=${this.toggleTheme}
          ></tini-switch>
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
        </div>
      </div>
    `;
  }
}
