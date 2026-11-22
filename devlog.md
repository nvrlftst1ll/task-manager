# Devlog — Task Manager

## [1.0.0] - 2026-11-22

### Добавлено

- Часть 1: `user-flow.html` — блок-схема пользовательских сценариев на чистом
  HTML + CSS (8 колонок-сценариев, ромбы-решения, CSS-стрелки, легенда,
  адаптив < 900 px, текстовая расшифровка для accessibility в конце файла).
- Main-процесс Electron (`electron/`):
  - frameless-окно с кастомным title bar (мигание/максимизация/закрытие по IPC);
  - preload через contextBridge + sandbox, без nodeIntegration;
  - SQLite-слой: чистые репозитории задач и настроек (`ipc/repositories.ts`)
    поверх better-sqlite3 + IPC-клей (`ipc/database.ts`, `ipc/settings.ts`);
  - наблюдатель дедлайнов → системные уведомления (раз в минуту, один
    уведомление на задачу, сброс памяти при изменении задачи);
  - меню File / Edit / View / Help, включая открытие user-flow.html и «О приложении»;
  - single-instance lock.
- Renderer (`src/`):
  - канбан-доска To Do / In Progress / Done с @dnd-kit (PointerSensor + KeyboardSensor,
    DragOverlay, оптимистичная смена статуса с откатом);
  - CRUD-формы с двухслойной валидацией (renderer: подсветка полей;
    main: строгая проверка входа);
  - поиск и фильтры: текст, статус, приоритет, тег, дата (сегодня/7 дней/просроченные);
  - тёмная/светлая/системная тема на CSS-переменных с сохранением в SQLite;
  - онбординг при первом запуске (выбор темы + подсказки);
  - горячие клавиши Ctrl+N / Ctrl+F / Ctrl+, (+ Esc, Space/стрелки для dnd);
  - экран настроек: тема, уведомления, порог дедлайна, экспорт задач в JSON;
  - тосты, диалог удаления с подтверждением, детали задачи со сменой статуса;
  - браузерный фолбэк: localStorage-адаптер с демо-данными (`npm run dev:renderer`).
- Тесты: unit (валидация, фильтры, localStorage-адаптер), integration
  (SQLite-репозитории, in-memory), e2e (Playwright Electron, локальный запуск).
- CI: `.github/workflows/build.yml` (lint → typecheck → unit-тесты → сборка).
- Документация: readme.md, context.md, testlog.md, dialog.md, .env.example.

### Решения

- better-sqlite3 вместо localStorage: надёжная персистентность + SQL-сортировка;
  localStorage оставлен как фолбэк для браузерной разработки.
- Репозитории вынесены в модуль без electron-импортов — это позволило покрыть
  SQL-слой integration-тестами без запуска Electron.
- Единый контракт `TaskApi` (types) для preload-моста и localStorage-адаптера.

## [0.1.0] - 2026-11-22

- Инициализация проекта: каркас Electron + React + Vite, tsconfig-схема
  (renderer / electron), ESLint + Prettier, .gitignore, .env.example,
  скрипты dev/build/start/dist.
