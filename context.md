# Context — архитектура Task Manager

## Общая картина

Приложение построено по процессной модели Electron: **main** (Node.js) владеет
окном, меню и SQLite; **renderer** (React) не имеет доступа к Node и общается
с main только через **preload-мост** (`contextBridge` + `ipcRenderer.invoke`).
Благодаря единому контракту `TaskApi` renderer одинаково работает и с IPC-мостом,
и с localStorage-фолбэком для чисто браузерной разработки.

```mermaid
flowchart LR
  subgraph Renderer["Renderer (React 18, Vite)"]
    UI["Компоненты:<br/>TitleBar, KanbanBoard,<br/>TaskCard, модалки"]
    Stores["Zustand-сторы:<br/>tasks / settings / ui"]
    Lib["lib: validation,<br/>filters, format, api"]
    UI --> Stores
    Stores --> Lib
  end

  subgraph Preload["Preload (sandbox, contextBridge)"]
    Bridge["window.taskApi"]
  end

  subgraph Main["Main (Node.js)"]
    IPC["ipcMain.handle:<br/>tasks:*, settings:*<br/>ipcMain.on: window:*"]
    Repos["repositories.ts<br/>(чистый better-sqlite3)"]
    Watcher["Наблюдатель<br/>дедлайнов (60 с)"]
    Menu["Меню приложения"]
    Win["BrowserWindow<br/>(frameless)"]
  end

  SQLite[("SQLite<br/>task-manager.db")]

  Lib <-->|"window.taskApi"| Bridge
  Bridge <-->|invoke / send| IPC
  IPC --> Repos
  Repos --> SQLite
  Watcher --> Repos
  Watcher -->|"Notification"| OS["Системные уведомления"]
  Menu -->|"menu:action"| Bridge
  Watcher --> Win
```

## Схема базы данных (SQLite)

```mermaid
erDiagram
  tasks {
    TEXT id PK
    TEXT title
    TEXT description
    TEXT deadline "ISO 8601 либо NULL"
    TEXT priority "low | medium | high"
    TEXT tags "JSON-массив строк"
    TEXT status "todo | in_progress | done"
    TEXT created_at
    TEXT updated_at
  }
  settings {
    TEXT key PK
    TEXT value
  }
```

Индексы: `idx_tasks_status(status)`, `idx_tasks_deadline(deadline)`.
Ключи настроек: `theme`, `notificationsEnabled`, `deadlineThresholdHours`, `onboarded`.

## Ключевые потоки

- **Создание/редактирование задачи.** Форма валидируется на клиенте
  (`validateTaskForm`), затем данные уходят в main, где происходит строгая
  проверка (`assertTaskInput`) перед записью в SQLite. Ошибка main-процесса
  показывается в форме как общая ошибка — обе ветки блок-схемы user flow
  («валидация пройдена / не пройдена») реализованы.
- **Смена статуса.** Drag & drop (@dnd-kit) или кнопки в деталях задачи →
  оптимистичное обновление стора → `tasks:update` по IPC; при ошибке откат.
- **Уведомления.** main каждую минуту перечитывает настройки и незакрытые
  задачи с дедлайном; уведомление показывается один раз на задачу, память
  сбрасывается при изменении задачи (`forget`).
- **Тема.** `data-theme` на `<html>`; режим `system` слушает `prefers-color-scheme`.
- **Онбординг.** Показывается, пока в настройках `onboarded = false`
  (первый запуск), завершение фиксируется в SQLite.

## Схема валидации (общая для слоёв)

```mermaid
flowchart TD
  Form["Форма (renderer)<br/>validateTaskForm — подсветка полей"] -->|"TaskInput"| API["Граница API<br/>assertTaskInput (renderer-фолбэк и main)"]
  API -->|"ok"| DB[("SQLite")]
  API -->|"Error с текстом на русском"| Form
```

## Места, которые важно знать при доработках

- Контракт IPC-каналов: `electron/preload.ts` ↔ `electron/ipc/*.ts` — менять
  синхронно.
- Список каналов: `tasks:list|create|update|delete`, `settings:get-all|set`,
  `window:minimize|toggle-maximize|close`, события: `window:state`, `menu:action`.
- Чистые модули (без electron/DOM): `electron/ipc/repositories.ts`,
  `src/lib/validation.ts`, `src/lib/filters.ts` — расширение логики лучше
  начинать здесь, оно автоматически попадёт под тесты.
