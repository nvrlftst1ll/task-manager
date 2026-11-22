// ============================================================
// [START: Preload — безопасный IPC-мост (contextBridge)]
// Renderer не получает ни Node, ни Electron API напрямую.
// Все вызовы идут через ipcRenderer.invoke/send, а события
// main-процесса подписываются с возможностью отписки.
// ============================================================
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type { MenuAction, Settings, Task, TaskInput, WindowState } from '../src/types';

/**
 * Подписка на событие main-процесса.
 * @param channel имя канала
 * @param cb обработчик полезной нагрузки
 * @returns функция отписки (для useEffect-очистки в React)
 */
function subscribe<T>(channel: string, cb: (payload: T) => void): () => void {
  const listener = (_event: IpcRendererEvent, payload: T) => cb(payload);
  ipcRenderer.on(channel, listener);
  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}

/** API, экспортируемый в renderer как window.taskApi. */
const api = {
  platform: process.platform,

  tasks: {
    list: (): Promise<Task[]> => ipcRenderer.invoke('tasks:list'),
    create: (input: TaskInput): Promise<Task> => ipcRenderer.invoke('tasks:create', input),
    update: (id: string, patch: Partial<TaskInput>): Promise<Task> =>
      ipcRenderer.invoke('tasks:update', { id, patch }),
    remove: (id: string): Promise<boolean> => ipcRenderer.invoke('tasks:delete', id),
  },

  settings: {
    getAll: (): Promise<Settings> => ipcRenderer.invoke('settings:get-all'),
    set: (patch: Partial<Settings>): Promise<Settings> =>
      ipcRenderer.invoke('settings:set', patch),
  },

  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    toggleMaximize: () => ipcRenderer.send('window:toggle-maximize'),
    close: () => ipcRenderer.send('window:close'),
    onStateChange: (cb: (state: WindowState) => void) => subscribe('window:state', cb),
  },

  menu: {
    onAction: (cb: (action: MenuAction) => void) => subscribe('menu:action', cb),
  },
};

contextBridge.exposeInMainWorld('taskApi', api);
// ============================================================
// [END: Preload — безопасный IPC-мост]
// ============================================================
