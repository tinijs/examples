import {createStore} from '@tinijs/store';

import {ChunkData} from '../helpers/render';

export interface Task {
  id: string;
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
  const tasks = [...(mainStore.tasks || [])];
  tasks.unshift({
    id: Date.now() + String(Math.random() * 10000).slice(0, 3),
    content,
    done: false,
  });
  console.log(tasks[0]);
  mainStore.commit('tasks', tasks);
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function updateTask(id: string, done: boolean) {
  const tasks = (mainStore.tasks || []).map(task => {
    if (task.id === id) return {...task, done};
    return task;
  });
  mainStore.commit('tasks', tasks);
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function deleteTask(id: string) {
  const tasks = (mainStore.tasks || []).filter(task => task.id !== id);
  mainStore.commit('tasks', tasks);
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}
