import {html} from 'lit';

import {CommonColors, CommonGradients} from 'tinijs';
import {
  Component,
  TiniComponent,
  Reactive,
  Output,
  EventEmitter,
} from '@tinijs/core';

import {IconSendFilledComponent} from '@tinijs/fluent-icons/send-filled';
import {TiniTextareaComponent} from '@tinijs/ui/components/textarea';

@Component({
  components: [IconSendFilledComponent, TiniTextareaComponent],
})
export class AppComposeComponent extends TiniComponent {
  static readonly defaultTagName = 'app-compose';

  @Output() commit!: EventEmitter<string>;

  @Reactive() currentContent = '';

  private commitContent() {
    if (!this.currentContent) return;
    this.commit.emit(this.currentContent);
    this.currentContent = '';
  }

  protected render() {
    return html`
      <div
        style="
          display: flex;
          align-items: flex-start;
          gap: var(--size-space-0_5x);
        "
      >
        <tini-textarea
          style="flex: 1"
          focus:scheme=${CommonColors.Blue}
          events="input"
          styleDeep="
            .textarea {
              resize: none;
              height: 40px;
              border-radius: 1000px;
            }
          "
          .value=${this.currentContent}
          @input=${(e: CustomEvent<InputEvent>) =>
            (this.currentContent = (
              e.detail.target as HTMLTextAreaElement
            ).value)}
        ></tini-textarea>
        <button
          style="
            display: flex;
            align-items: center;
            justify-content: center;
            background: none;
            border: none;
            padding: var(--size-space-0_5x);
            cursor: pointer;
          "
          @click=${this.commitContent}
        >
          <icon-send-filled
            scheme=${CommonGradients.DiscoClub}
            scale="sm"
          ></icon-send-filled>
        </button>
      </div>
    `;
  }
}
