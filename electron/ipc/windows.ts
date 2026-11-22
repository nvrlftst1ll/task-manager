// ============================================================
// [START: Главное окно + кастомный title bar]
// Окно создаётся frameless (frame: false) — рамку рисует renderer
// (компонент TitleBar), а управление окном идёт по IPC.
// ============================================================
import { BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';

let mainWindow: BrowserWindow | null = null;

/** Возвращает текущее главное окно (может быть null после закрытия). */
export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

/**
 * Создаёт главное окно приложения.
 * В dev-режиме загружает URL Vite-сервера (VITE_DEV_SERVER_URL),
 * в проде — собранный dist/index.html по file://.
 */
export function createMainWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    frame: false, // кастомный title bar в renderer
    show: false,
    // тёмная заглушка: окно не мигает белым до применения темы
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // включён по умолчанию, но фиксируем явно
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Показываем окно только когда оно готово — без «серого» мигания
  mainWindow.once('ready-to-show', () => mainWindow?.show());

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // dist-electron/main.js → соседний каталог dist/
    void mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Рассылаем состояние окна для иконки «развернуть/восстановить»
  const sendState = () => {
    mainWindow?.webContents.send('window:state', {
      maximized: mainWindow?.isMaximized() ?? false,
    });
  };
  mainWindow.on('maximize', sendState);
  mainWindow.on('unmaximize', sendState);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

/** Регистрирует IPC-каналы кнопок кастомного title bar. */
export function registerWindowIpc(): void {
  ipcMain.on('window:minimize', () => mainWindow?.minimize());
  ipcMain.on('window:toggle-maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.on('window:close', () => mainWindow?.close());
}
// ============================================================
// [END: Главное окно + кастомный title bar]
// ============================================================
