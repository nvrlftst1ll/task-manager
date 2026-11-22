// ============================================================
// [START: Стор задач (Zustand) + персистентность через IPC]
// Все записи идут в main-процесс (SQLite). Обновления статуса
// применяются оптимистично с откатом при ошибке — доска не
// «замирает» на время IPC-обмена.
// ============================================================
import { create } from 'zustand';
import type { Task, TaskInput, TaskStatus } from '../types';
import { getTaskApi } from '../lib/api';
import { useUiStore } from './uiStore';

interface TasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  createTask: (input: TaskInput) => Promise<Task>;
  updateTask: (id: string, patch: Partial<TaskInput>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, status: TaskStatus) => Promise<void>;
}

export const useTasksStore = create<TasksState>()((set, get) => ({
  tasks: [],
  loading: true,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await getTaskApi().tasks.list();
      set({ tasks, loading: false });
    } catch (error) {
      console.error('[tasks] ошибка загрузки:', error);
      set({ loading: false, error: 'Не удалось загрузить задачи' });
      useUiStore.getState().showToast('Не удалось загрузить задачи', 'error');
    }
  },

  createTask: async (input) => {
    // Ошибки валидации намеренно пробрасываются в форму
    const task = await getTaskApi().tasks.create(input);
    set((s) => ({ tasks: [task, ...s.tasks] }));
    return task;
  },

  updateTask: async (id, patch) => {
    const task = await getTaskApi().tasks.update(id, patch);
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? task : t)) }));
    return task;
  },

  deleteTask: async (id) => {
    const removed = await getTaskApi().tasks.remove(id);
    if (removed) {
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    }
  },

  moveTask: async (id, status) => {
    const previous = get().tasks;
    const target = previous.find((t) => t.id === id);
    if (!target || target.status === status) return;

    // Оптимистичное обновление: карточка сразу уезжает в новую колонку
    set({
      tasks: previous.map((t) =>
        t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t
      ),
    });

    try {
      const task = await getTaskApi().tasks.update(id, { status });
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? task : t)) }));
    } catch (error) {
      console.error('[tasks] ошибка смены статуса:', error);
      set({ tasks: previous }); // откат к исходному состоянию
      useUiStore.getState().showToast('Не удалось изменить статус задачи', 'error');
    }
  },
}));
// ============================================================
// [END: Стор задач]
// ============================================================
