import {html} from 'lit';
import {map} from 'lit/directives/map';
import {styleMap} from 'lit/directives/style-map';

import {CommonColors, CommonGradients, Scales} from 'tinijs';
import {
  Component,
  TiniComponent,
  Input,
  Output,
  EventEmitter,
} from '@tinijs/core';

import {IconCloseComponent} from '@tinijs/mdi-icons/close';
import {TiniCheckboxesComponent} from '@tinijs/ui/components/checkboxes';

import {Task} from '../stores/main';

export interface ToggleEventDetail {
  index: number;
  done: boolean;
}

@Component({
  components: [IconCloseComponent, TiniCheckboxesComponent],
})
export class AppTasksComponent extends TiniComponent {
  static readonly defaultTagName = 'app-tasks';

  @Input() tasks: Task[] = [];

  @Output() toggle!: EventEmitter<ToggleEventDetail>;
  @Output() delete!: EventEmitter<number>;

  protected render() {
    return map(
      this.tasks,
      (task, index) => html`
        <div
          style=${styleMap({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--color-background-tint)',
            padding: 'var(--size-space-0_75x) var(--size-space)',
            border: '1px solid var(--color-background-shade)',
            borderRadius: 'var(--size-radius)',
            marginBottom: 'var(--size-space)',
            gap: 'var(--size-space)',
            opacity: !task.done ? 1 : 0.5,
          })}
        >
          <div
            style="
              display: flex;
              align-items: center;
              justify-content: flex-start;
              gap: var(--size-space);
            "
          >
            <tini-checkboxes
              events="change"
              .items=${[
                {
                  'checked:scheme': CommonColors.Teal,
                  scale: Scales.XL,
                  checked: task.done,
                },
              ]}
              @change=${(e: CustomEvent<InputEvent>) =>
                this.toggle.emit({
                  index,
                  done: (e.detail.target as any).checked,
                })}
            ></tini-checkboxes>
            <strong
              style=${styleMap({
                fontSize: 'var(--size-text-1_5x)',
                fontWeight: !task.done ? 'bold' : 'normal',
                textDecoration: !task.done ? 'none' : 'line-through',
                color: !task.done
                  ? 'var(--color-foreground)'
                  : 'var(--color-medium)',
              })}
              >${task.content}</strong
            >
          </div>
          <div>
            <button
              style="
                display: flex;
                align-items: center;
                justify-content: center;
                background: none;
                border: none;
                padding: 0;
                cursor: pointer;
              "
              @click=${() => this.delete.emit(index)}
            >
              <icon-close scheme=${CommonGradients.BloodyMimosa}></icon-close>
            </button>
          </div>
        </div>
      `
    );
  }
}
