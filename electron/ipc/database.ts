// ============================================================
// [START: IPC задач + управление соединением с SQLite]
// Electron-«клей»: хранит единственное соединение с БД в каталоге
// userData и регистрирует IPC-каналы задач. Вся SQL-логика —
// в чистом модуле repositories.ts (покрыта тестами).
// ============================================================
import Database from 'better-sqlite3';
import { app, ipcMain, type IpcMainInvokeEvent } from 'electron';
import path from 'node:path';
import {
  createTaskRepository,
  prepareDatabase,
  type TaskRepository,
} from './repositories';

let db: Database.Database | null = null;
let repository: TaskRepository | null = null;

/**
 * Возвращает singleton-соединение с БД, создавая его при первом вызове.
 * Файл лежит в userData — корректное место для данных приложения
 * на всех платформах (win/mac/linux).
 */
export function getDb(): Database.Database {
  if (db) return db;
  const dbPath = path.join(app.getPath('userData'), 'task-manager.db');
  db = new Database(dbPath);
  // WAL-режим надёжнее при внезапном закрытии процесса
  db.pragma('journal_mode = WAL');
  prepareDatabase(db);
  return db;
}

/** Возвращает singleton-репозиторий задач. */
export function getTaskRepository(): TaskRepository {
  if (!repository) repository = createTaskRepository(getDb());
  return repository;
}

/** Аккуратно закрывает соединение (вызывается при выходе из приложения). */
export function closeDb(): void {
  try {
    db?.close();
  } catch (error) {
    console.error('[database] ошибка при закрытии БД:', error);
  } finally {
    db = null;
    repository = null;
  }
}

/** Разбирает payload канала tasks:update: { id: string; patch: object }. */
function parseUpdatePayload(payload: unknown): { id: string; patch: unknown } {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    typeof (payload as { id?: unknown }).id !== 'string'
  ) {
    throw new Error('Некорректный запрос обновления задачи');
  }
  return {
    id: (payload as { id: string }).id,
    patch: (payload as { patch?: unknown }).patch ?? {},
  };
}

/**
 * Оборачивает IPC-обработчик: логирует ошибку в main-процесс
 * и пробрасывает её в renderer (invoke-промис отклоняется).
 */
function logErrors<Args extends unknown[], R>(handler: (...args: Args) => R) {
  return (...args: Args): R => {
    try {
      return handler(...args);
    } catch (error) {
      console.error('[ipc] ошибка обработчика:', error);
      throw error;
    }
  };
}

/**
 * Регистрирует IPC-каналы задач.
 * @param options.onTaskMutated колбэк после изменения задачи —
 *        наблюдатель дедлайнов сбрасывает по нему память уведомлений
 */
export function registerDatabaseIpc(
  options: { onTaskMutated?: (taskId: string) => void } = {}
): void {
  ipcMain.handle(
    'tasks:list',
    logErrors((_event: IpcMainInvokeEvent) => getTaskRepository().list())
  );

  ipcMain.handle(
    'tasks:create',
    logErrors((_event: IpcMainInvokeEvent, input: unknown) => {
      const task = getTaskRepository().create(input);
      options.onTaskMutated?.(task.id);
      return task;
    })
  );

  ipcMain.handle(
    'tasks:update',
    logErrors((_event: IpcMainInvokeEvent, payload: unknown) => {
      const { id, patch } = parseUpdatePayload(payload);
      const task = getTaskRepository().update(id, patch);
      options.onTaskMutated?.(task.id);
      return task;
    })
  );

  ipcMain.handle(
    'tasks:delete',
    logErrors((_event: IpcMainInvokeEvent, id: unknown) => {
      if (typeof id !== 'string') throw new Error('Некорректный идентификатор задачи');
      const removed = getTaskRepository().remove(id);
      if (removed) options.onTaskMutated?.(id);
      return removed;
    })
  );
}
// ============================================================
// [END: IPC задач + управление соединением с SQLite]
// ============================================================
