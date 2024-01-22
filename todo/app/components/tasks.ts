import {html} from 'lit';
import {repeat} from 'lit/directives/repeat';
import {styleMap} from 'lit/directives/style-map';
import {ref, Ref, createRef} from 'lit/directives/ref';
import autoAnimate from '@formkit/auto-animate';

import {CommonColors, CommonGradients, Scales} from 'tinijs';
import {
  Component,
  TiniComponent,
  Input,
  Output,
  OnReady,
  EventEmitter,
} from '@tinijs/core';

import {IconCloseComponent} from '@tinijs/mdi-icons/close';
import {TiniCheckboxesComponent} from '@tinijs/ui/components/checkboxes';

import {Task} from '../stores/main';

export interface ToggleEventDetail {
  task: Task;
  done: boolean;
}

@Component({
  components: [IconCloseComponent, TiniCheckboxesComponent],
})
export class AppTasksComponent extends TiniComponent implements OnReady {
  static readonly defaultTagName = 'app-tasks';

  @Input() tasks: Task[] = [];

  @Output() toggle!: EventEmitter<ToggleEventDetail>;
  @Output() delete!: EventEmitter<Task>;

  private containerRef: Ref<HTMLDivElement> = createRef();

  onReady() {
    if (this.containerRef.value) {
      autoAnimate(this.containerRef.value);
    }
  }

  protected render() {
    return html`
      <div ${ref(this.containerRef)}>
        ${repeat(
          this.tasks,
          task => task.id,
          task => html`
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
                transition: 'opacity 0.5s ease-in-out',
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
                  styleDeep=${`
                    .input {
                      min-width: var(--checkbox-scale);
                      min-height: var(--checkbox-scale);
                    }
                    .label {
                      color: ${
                        !task.done
                          ? 'var(--color-foreground)'
                          : 'var(--color-medium)'
                      };
                      text-decoration: ${!task.done ? 'none' : 'line-through'};
                    }
                  `}
                  .items=${[
                    {
                      'checked:scheme': CommonColors.Teal,
                      scale: Scales.XL,
                      label: task.content,
                      checked: task.done,
                    },
                  ]}
                  @change=${(e: CustomEvent<InputEvent>) =>
                    this.toggle.emit({
                      task,
                      done: (e.detail.target as any).checked,
                    })}
                ></tini-checkboxes>
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
                  @click=${() => this.delete.emit(task)}
                >
                  <icon-close
                    scheme=${CommonGradients.BloodyMimosa}
                  ></icon-close>
                </button>
              </div>
            </div>
          `
        )}
      </div>
    `;
  }
}
