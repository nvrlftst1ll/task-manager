// ============================================================
// [START: ЭТАП 1 - Точка входа main-процесса]
// Обязанности: single-instance блокировка, инициализация БД,
// регистрация IPC, создание окна и меню, запуск наблюдателя
// дедлайнов, корректное закрытие ресурсов при выходе.
// ============================================================
import { app, BrowserWindow } from 'electron';
import { closeDb, getDb, getTaskRepository, registerDatabaseIpc } from './ipc/database';
import { createSettingsReader, registerSettingsIpc } from './ipc/settings';
import { createDeadlineWatcher, type DeadlineWatcher } from './ipc/notifications';
import { buildAppMenu } from './ipc/menu';
import { createMainWindow, getMainWindow, registerWindowIpc } from './ipc/windows';

// ==========================================
// [START: ЭТАП 1.1 - Single instance lock]
// Второй запуск приложения не создаёт новое окно,
// а фокусирует уже открытое.
// ==========================================
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = getMainWindow();
    if (win) {
      win.show();
      win.focus();
    }
  });
  void app.whenReady().then(bootstrap);
}
// ==========================================
// [END: ЭТАП 1.1 - Single instance lock]
// ==========================================

let watcher: DeadlineWatcher | null = null;

/**
 * Инициализация приложения после готовности Electron.
 * Порядок важен: БД и IPC — до окна, чтобы renderer при старте
 * сразу смог читать данные.
 */
function bootstrap(): void {
  // ==========================================
  // [START: ЭТАП 1.2 - БД и IPC-каналы]
  // ==========================================
  getDb(); // создаём соединение и схему заранее
  registerWindowIpc();

  const repository = getTaskRepository();
  const readSettings = createSettingsReader(getDb);

  registerDatabaseIpc({
    // наблюдатель сбрасывает память уведомлений по изменённой задаче
    onTaskMutated: (taskId) => watcher?.forget(taskId),
  });
  registerSettingsIpc({ getDb });
  // ==========================================
  // [END: ЭТАП 1.2 - БД и IPC-каналы]
  // ==========================================

  // ==========================================
  // [START: ЭТАП 1.3 - Окно, меню, наблюдатель дедлайнов]
  // ==========================================
  const win = createMainWindow();
  buildAppMenu(win);

  watcher = createDeadlineWatcher({
    repository,
    getSettings: readSettings,
    getWindow: getMainWindow,
  });
  watcher.start();
  // ==========================================
  // [END: ЭТАП 1.3 - Окно, меню, наблюдатель дедлайнов]
  // ==========================================
}

// macOS: все окна закрыты — приложение остаётся жить в доке
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// macOS: клик по иконке в доке пересоздаёт окно
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

// Финальная очистка ресурсов перед выходом
app.on('will-quit', () => {
  watcher?.stop();
  closeDb();
});
// ============================================================
// [END: ЭТАП 1 - Точка входа main-процесса]
// ============================================================
