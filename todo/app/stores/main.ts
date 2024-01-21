import {createStore} from '@tinijs/store';

import {ChunkData} from '../helpers/render';

export interface Task {
  content: string;
  done: boolean;
}

export const mainStore = createStore({
  tasks: undefined as ChunkData<Task[]>,
});

const TASKS_KEY = 'tasks';

export function loadTasks() {
  const data = localStorage.getItem(TASKS_KEY);
  if (!data) mainStore.tasks = [];
  else mainStore.tasks = JSON.parse(data);
}

export function addTask(content: string) {
  const tasks = [{content, done: false}, ...(mainStore.tasks || [])];
  mainStore.commit('tasks', tasks);
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function updateTask(index: number, done: boolean) {
  const tasks = (mainStore.tasks || []).map((task, i) => {
    if (i === index) return {...task, done};
    return task;
  });
  mainStore.commit('tasks', tasks);
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function deleteTask(index: number) {
  const tasks = (mainStore.tasks || []).filter((_, i) => i !== index);
  mainStore.commit('tasks', tasks);
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}
