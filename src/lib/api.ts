// ============================================================
// [START: Резолвер API (Electron bridge или localStorage-фолбэк)]
// ============================================================
import type { TaskApi } from '../types';
import { LocalStorageApi } from './localStorageApi';

let fallbackApi: TaskApi | null = null;

/**
 * Возвращает API задач: внутри Electron — window.taskApi
 * (preload + contextBridge), в обычном браузере — адаптер
 * поверх localStorage с демо-данными.
 */
export function getTaskApi(): TaskApi {
  if (typeof window !== 'undefined' && window.taskApi) {
    return window.taskApi;
  }
  if (!fallbackApi) {
    const adapter = new LocalStorageApi(window.localStorage);
    adapter.ensureSeed();
    fallbackApi = adapter;
  }
  return fallbackApi;
}
// ============================================================
// [END: Резолвер API]
// ============================================================
