# Task Manager

Кроссплатформенный менеджер задач для настольных ОС (Windows / macOS / Linux):
канбан-доска, drag & drop, системные уведомления о дедлайнах, тёмная/светлая тема,
горячие клавиши и кастомный title bar.

**Стек:** Electron 33 · React 18 · TypeScript 5 · Zustand · better-sqlite3 (через IPC) ·
Vite 5 · @dnd-kit · esbuild · ESLint + Prettier · Vitest + Playwright.

Рядом с приложением лежит визуальная документация пользовательских сценариев:
**`user-flow.html`** — блок-схема на чистом HTML + CSS (открывается в любом браузере,
а также из меню приложения: Справка → Открыть схему User Flow).

---

## Быстрый старт

Требования: Node.js ≥ 18, npm. Сборка нативного модуля лучше-sqlite3 происходит
автоматически при установке (postinstall → electron-builder install-app-deps);
при проблемах см. раздел «Нативный модуль» ниже.

```bash
npm install     # зависимости + пересборка better-sqlite3 под Electron
npm run dev     # запуск в dev-режиме (Vite + esbuild watch + Electron)
```

Dev-режим — это три параллельных процесса:

1. **vite** — dev-сервер renderer на `localhost:5173` (HMR);
2. **esbuild --watch** — компиляция `electron/main.ts` и `electron/preload.ts` в `dist-electron/`;
3. **electron** — стартует после готовности Vite (`wait-on tcp:5173`) и загружает
   `VITE_DEV_SERVER_URL`. Изменения renderer применяются мгновенно; изменения
   main/preload требуют перезапуска `npm run dev`.

Можно разрабатывать интерфейс и вовсе без Electron — `npm run dev:renderer` запускает
только Vite: приложение автоматически переключится на localStorage-адаптер с демо-данными.

## Остальные команды

| Команда | Что делает |
|---|---|
| `npm run lint` | ESLint (ts/tsx, предупреждения = ошибки) |
| `npm run format` | Prettier |
| `npm run typecheck` | tsc для renderer и для electron-кода |
| `npm test` | Unit-тесты (Vitest) |
| `npm run test:integration` | Интеграционные тесты SQLite (см. ниже) |
| `npm run test:e2e` | E2E Playwright: сборка + запуск приложения |
| `npm run build` | Прод-сборка: esbuild (main/preload) + vite build |
| `npm run start` | `build` + запуск собранного приложения |
| `npm run dist` | Установщики (electron-builder → папка `release/`) |

### Нюанс: интеграционные тесты и нативный модуль

`better-sqlite3` — нативный модуль с одним бинарником. После
`npm install` он собран под Electron (это делает postinstall), поэтому тесты
под обычным Node его загрузить не могут. Скрипт `test:integration` сам
выполняет `npm rebuild better-sqlite3` (сборка под текущий Node) и затем
запускает тесты. После прогона верните бинарник под Electron:

```bash
npx electron-builder install-app-deps
```

E2E-тесты (`tests/e2e`) запускаются только локально: им нужен собранный
`dist/` и дисплей. Drag & drop в автоматизации проверен частично —
каналы смены статуса (кнопки в деталях задачи) покрыты e2e, само
перетаскивание проверяется вручную (см. `testlog.md`).

## Переменные окружения

Приложение работает без `.env`. Единственная переменная —
`VITE_DEV_SERVER_URL` (устанавливается скриптом `dev:electron` автоматически,
см. `.env.example`).

## Структура проекта

```
task-manager/
├─ electron/               # main-процесс Electron
│  ├─ main.ts              # инициализация, жизненный цикл
│  ├─ preload.ts           # contextBridge: безопасный IPC-мост
│  └─ ipc/                 # windows, database, settings,
│                          # notifications, menu, repositories
├─ src/                    # renderer (React 18)
│  ├─ components/          # TitleBar, KanbanBoard, TaskCard, формы…
│  ├─ pages/               # BoardPage, SettingsPage
│  ├─ store/               # Zustand: tasks, settings, ui
│  ├─ hooks/               # useHotkeys, useTheme
│  ├─ lib/                 # validation, filters, api, format
│  ├─ types/               # общие типы (Task, Settings, TaskApi)
│  ├─ styles/global.css    # темы light/dark на CSS-переменных
│  ├─ App.tsx
│  └─ main.tsx
├─ tests/                  # unit / integration / e2e
├─ .github/workflows/      # CI (lint → typecheck → тесты → сборка)
├─ user-flow.html          # Часть 1: блок-схема user flow
└─ package.json, vite.config.ts, tsconfig*.json, eslint, prettier
```

## CI/CD

`.github/workflows/build.yml`: на каждый push/PR в `main` — установка
зависимостей с кэшированием, линтер, проверка типов, unit-тесты и сборка.
Тесты идут строго до сборки: падение тестов останавливает пайплайн.

## Файлы проекта (методология Based)

- `devlog.md` — история версий и изменений;
- `context.md` — архитектура, схема БД и модулей (Mermaid);
- `testlog.md` — журнал прогонов тестов (что и где реально запускалось);
- `dialog.md` — внутренний журнал диалога разработки (не нужен для работы
  приложения, полезен для аудита);
- `.env.example` — перечень переменных окружения.

## Данные

Все задачи и настройки хранятся в SQLite: `app.getPath('userData')/task-manager.db`
(Windows: `%APPDATA%/task-manager`, macOS: `~/Library/Application Support/task-manager`,
Linux: `~/.config/task-manager`). Экспорт в JSON — в настройках приложения.
