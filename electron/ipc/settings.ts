// ============================================================
// [START: IPC настроек приложения]
// Настройки читаются/пишутся в ту же SQLite-базу (таблица settings)
// через чистый репозиторий из repositories.ts.
// ============================================================
import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import type Database from 'better-sqlite3';
import type { Settings } from '../../src/types';
import { createSettingsRepository } from './repositories';

/**
 * Создаёт функцию чтения актуальных настроек.
 * Используется наблюдателем дедлайнов: настройки перечитываются
 * на каждом тике, поэтому изменения применяются без перезапуска.
 * @param getDb поставщик соединения с БД
 */
export function createSettingsReader(getDb: () => Database.Database): () => Settings {
  return () => createSettingsRepository(getDb()).read();
}

/**
 * Регистрирует IPC-каналы настроек.
 * @param options.getDb поставщик соединения с БД
 */
export function registerSettingsIpc(options: { getDb: () => Database.Database }): void {
  ipcMain.handle('settings:get-all', () => createSettingsRepository(options.getDb()).read());

  ipcMain.handle(
    'settings:set',
    (_event: IpcMainInvokeEvent, patch: unknown) => {
      try {
        const repo = createSettingsRepository(options.getDb());
        repo.write(patch);
        return repo.read();
      } catch (error) {
        console.error('[ipc] ошибка сохранения настроек:', error);
        throw error;
      }
    }
  );
}
// ============================================================
// [END: IPC настроек приложения]
// ============================================================
