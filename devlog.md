# Devlog — Task Manager

## [1.2.0] - 2026-11-22

### Добавлено

- Figma-кит переноса дизайна (figma/):
  - плагин-генератор `plugin/` (manifest.json + code.js): рисует 7
    экранов — Board light/dark, модалки «Новая задача» и «Детали
    задачи», настройки, онбординг, UI-кит — auto-layout'ом, с
    именованными слоями и палитрами 1:1 из global.css (Inter,
    фолбэк на Roboto);
  - `design-tokens.json` (формат Tokens Studio): наборы light /
    dark / core, переключение тем через $themes;
  - `README.md` с тремя способами переноса: плагин, Tokens Studio,
    html.to.design для user-flow.html (Часть 1).
- Причина: REST API Figma доступен только на чтение — создать файл
  или записать слои извне нельзя; генерация локальным плагином —
  официальный путь, а запуск в новом пустом файле Figma даёт тот
  самый «отдельный файл» с дизайном в аккаунте пользователя.

### Проверено

- `node --check` — синтаксис OK; manifest и токены — валидный JSON;
- сухой прогон плагина на мок-объекте Figma Plugin API: 7 экранов,
  681 узел, 0 ошибок, 0 NaN в цветах. Прогон поймал и помог исправить
  два бага: перепутанный порядок аргументов boardScreen в двух модалках
  и лишний divider-слой в auto-layout футере формы.

## [1.1.0] - 2026-11-22

### Добавлено

- CI развёрнут из одного job в полный пайплайн (`.github/workflows/build.yml`,
  шесть задач):
  - `quality`: ESLint → typecheck (два tsconfig) → unit-тесты;
  - `integration`: `npm rebuild better-sqlite3` (ABI Node) → тесты
    репозиториев на in-memory SQLite;
  - `build`: Vite + esbuild, артефакт `app-dist` для переиспользования;
  - `e2e`: Playwright + Electron в виртуальном дисплее xvfb, системные
    библиотеки через `npx playwright install-deps`;
  - `package` (только теги `v*.*.*`): матрица Linux/Windows/macOS →
    AppImage / NSIS .exe / .dmg; macOS без подписи
    (`CSC_IDENTITY_AUTO_DISCOVERY=false`);
  - `release`: черновик GitHub Release со всеми установщиками
    (softprops/action-gh-release, публикация вручную);
  - кэши node_modules / Electron / electron-builder по хэшу
    `package-lock.json`; concurrency-группа отменяет устаревшие прогоны;
    таймауты на каждую задачу.
- CI-режим main-процесса: при `CI=true` отключается аппаратное ускорение —
  иначе Electron не отрисует окно в headless-дисплее.

### Изменено

- e2e-спека: единая точка запуска `launchApp()` c CI-аргументами
  (`--no-sandbox --disable-gpu --disable-dev-shm-usage`); локальный запуск
  не меняется.
- `package-lock.json` закоммичен — CI ставит точные версии.
- `workflow_dispatch` получил чекбокс `package` (boolean): ручной запуск
  может собрать установщики без тега — условие job дополнено
  `github.event.inputs.package == 'true'`; для Linux-упаковки добавлена
  защитная установка libfuse2/libfuse2t64 (AppImage на Ubuntu 24.04).
  Причина: пользователи запускали workflow вручную и ожидали установщики,
  а jobs package/release пропускались (if-условие работает только от
  тегов `v*.*.*`).

### Проверено

- Локально прогнан весь путь CI: typecheck 0/0, ESLint 0, unit 61/61,
  integration 13/13, build успешен (testlog.md, раунд «CI-симуляция»).

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
