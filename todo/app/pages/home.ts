import {html} from 'lit';

import {CommonColors, CommonGradients, Scales} from 'tinijs';
import {Page, TiniComponent, OnCreate, render} from '@tinijs/core';
import {Subscribe} from '@tinijs/store';

import {IconFormatListCheckboxComponent} from '@tinijs/mdi-icons/format-list-checkbox';
import {TiniSpinnerComponent} from '@tinijs/ui/components/spinner';

import {
  Task,
  mainStore,
  loadTasks,
  addTask,
  updateTask,
  deleteTask,
} from '../stores/main';

import {AppComposeComponent} from '../components/compose';
import {AppTasksComponent, ToggleEventDetail} from '../components/tasks';

@Page({
  name: 'app-page-home',
  components: [
    IconFormatListCheckboxComponent,
    TiniSpinnerComponent,
    AppComposeComponent,
    AppTasksComponent,
  ],
})
export class AppPageHome extends TiniComponent implements OnCreate {
  @Subscribe(mainStore) private tasks = mainStore.tasks;

  onCreate() {
    loadTasks();
  }

  protected render() {
    return html`
      <div
        style="
          padding: var(--size-space-2x);
          display: flex;
          flex-flow: column;
          justify-content: center;
          max-width: var(--wide-sm);
          margin: auto;
        "
      >
        <app-compose
          @commit=${(e: CustomEvent<string>) => addTask(e.detail)}
        ></app-compose>

        <div style="margin-top: 2rem">
          ${render([this.tasks], {
            loading: () => this.loadingTemplate,
            empty: () => this.emptyTemplate,
            main: () => this.tasksTemplate,
          })}
        </div>
      </div>
    `;
  }

  private get loadingTemplate() {
    return html`
      <div
        style="
          padding: var(--size-space-2x);
          display: flex;
          justify-content: center;
          max-width: var(--wide-sm);
          margin: auto;
        "
      >
        <tini-spinner
          scheme=${CommonColors.Teal}
          scale=${Scales.ML}
        ></tini-spinner>
      </div>
    `;
  }

  private get emptyTemplate() {
    return html`
      <div style="margin-top: 3rem; text-align: center">
        <icon-format-list-checkbox
          scheme=${CommonGradients.KaleSalad}
          scale=${Scales.XXXL}
        ></icon-format-list-checkbox>
        <p style="color: var(--color-medium)">No tasks yet!</p>
      </div>
    `;
  }

  private get tasksTemplate() {
    return html`
      <app-tasks
        .tasks=${this.tasks}
        @toggle=${(e: CustomEvent<ToggleEventDetail>) =>
          updateTask(e.detail.task.id, e.detail.done)}
        @delete=${(e: CustomEvent<Task>) => deleteTask(e.detail.id)}
      ></app-tasks>
    `;
  }
}
