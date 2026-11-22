// ============================================================
// [START: Меню приложения (File / Edit / View / Help)]
// Пункты с горячими клавишами не выполняют логику сами — они
// отправляют действие в renderer по IPC (menu:action), где его
// обрабатывает тот же код, что и клавиатурные шорткаты.
// ============================================================
import { app, dialog, Menu, shell, type BrowserWindow, type MenuItemConstructorOptions } from 'electron';
import path from 'node:path';
import type { MenuAction } from '../../src/types';

/**
 * Собирает и устанавливает меню приложения.
 * @param win главное окно (получатель menu:action)
 */
export function buildAppMenu(win: BrowserWindow): void {
  const send = (action: MenuAction) => win.webContents.send('menu:action', action);

  /** Открывает user-flow.html в браузере по умолчанию (dev и prod-пути). */
  const openUserFlow = () => {
    const candidates = [
      // dev: dist-electron/main.js → корень проекта
      path.join(__dirname, '..', 'user-flow.html'),
    ];
    // prod: файл распакован из asar (см. asarUnpack в package.json)
    if (typeof process.resourcesPath !== 'undefined') {
      candidates.push(path.join(process.resourcesPath, 'app.asar.unpacked', 'user-flow.html'));
    }
    for (const candidate of candidates) {
      void shell.openPath(candidate).then((errorMessage) => {
        if (errorMessage) {
          console.error(`[menu] не удалось открыть ${candidate}:`, errorMessage);
        }
      });
    }
  };

  /** Диалог «О приложении». */
  const showAbout = () => {
    dialog.showMessageBox(win, {
      type: 'info',
      title: 'О приложении',
      message: 'Task Manager',
      detail: [
        `Версия: ${app.getVersion()}`,
        'Кроссплатформенный менеджер задач',
        'Electron + React 18 + TypeScript + Zustand + better-sqlite3',
        '',
        'Документация: Справка → Открыть схему User Flow',
      ].join('\n'),
      buttons: ['Закрыть'],
    });
  };

  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Файл',
      submenu: [
        { label: 'Новая задача', accelerator: 'CmdOrCtrl+N', click: () => send('new-task') },
        { type: 'separator' },
        {
          label: 'Выход',
          accelerator: process.platform === 'darwin' ? 'CmdOrCtrl+Q' : 'Alt+F4',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'Правка',
      submenu: [
        { role: 'undo', label: 'Отменить' },
        { role: 'redo', label: 'Повторить' },
        { type: 'separator' },
        { role: 'cut', label: 'Вырезать' },
        { role: 'copy', label: 'Копировать' },
        { role: 'paste', label: 'Вставить' },
        { role: 'selectAll', label: 'Выделить всё' },
        { type: 'separator' },
        { label: 'Найти задачи', accelerator: 'CmdOrCtrl+F', click: () => send('focus-search') },
        { label: 'Настройки', accelerator: 'CmdOrCtrl+,', click: () => send('open-settings') },
      ],
    },
    {
      label: 'Вид',
      submenu: [
        { role: 'reload', label: 'Перезагрузить' },
        { role: 'toggleDevTools', label: 'Инструменты разработчика' },
        { type: 'separator' },
        { label: 'Тема: светлая', click: () => send('theme-light') },
        { label: 'Тема: тёмная', click: () => send('theme-dark') },
      ],
    },
    {
      label: 'Справка',
      submenu: [
        { label: 'Открыть схему User Flow', click: openUserFlow },
        { label: 'Горячие клавиши и настройки', click: () => send('open-settings') },
        { type: 'separator' },
        { label: 'О приложении', click: showAbout },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
// ============================================================
// [END: Меню приложения]
// ============================================================
