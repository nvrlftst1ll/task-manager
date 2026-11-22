// ============================================================
// [START: Общие типы приложения]
// Файл используется и renderer-процессом (src/**), и main-процессом
// (electron/**), и preload. Поэтому он не должен импортировать
// ничего платформо-зависимого.
// ============================================================

/** Статусы задач канбан-доски (жизненный цикл To Do → In Progress → Done). */
export type TaskStatus = 'todo' | 'in_progress' | 'done';

/** Приоритет задачи. */
export type Priority = 'low' | 'medium' | 'high';

/** Режим темы оформления. */
export type ThemeMode = 'light' | 'dark' | 'system';

/** Задача (доменная модель). Даты — строки ISO 8601 для нативного JSON-сериализации. */
export interface Task {
  id: string;
  title: string;
  /** Пустая строка допустима (описание необязательно). */
  description: string;
  /** Дедлайн в ISO 8601 либо null, если не задан. */
  deadline: string | null;
  priority: Priority;
  /** Теги-метки; хранятся в SQLite как JSON-строка. */
  tags: string[];
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

/** Данные формы создания/редактирования без служебных полей. */
export type TaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

/** Настройки приложения (персистятся в SQLite, таблица settings). */
export interface Settings {
  theme: ThemeMode;
  notificationsEnabled: boolean;
  /** Порог, за который начинают приходить уведомления о дедлайне. */
  deadlineThresholdHours: 1 | 6 | 12 | 24;
  /** Пройден ли онбординг (показывается только при первом запуске). */
  onboarded: boolean;
}

/** Состояние окна, рассылаемое main-процессом в renderer. */
export interface WindowState {
  maximized: boolean;
}

/** Действия меню приложения, приходящие в renderer по IPC. */
export type MenuAction =
  | 'new-task'
  | 'focus-search'
  | 'open-settings'
  | 'theme-light'
  | 'theme-dark';

// ------------------------------------------------------------
// Справочники значений
// ------------------------------------------------------------

export const STATUSES: readonly TaskStatus[] = ['todo', 'in_progress', 'done'] as const;

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

export const PRIORITIES: readonly Priority[] = ['low', 'medium', 'high'] as const;

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

export const THEME_LABELS: Record<ThemeMode, string> = {
  light: 'Светлая',
  dark: 'Тёмная',
  system: 'Системная',
};

export const DEADLINE_THRESHOLDS: readonly Settings['deadlineThresholdHours'][] = [
  1,
  6,
  12,
  24,
] as const;

/** Значение настроек по умолчанию (используется и main-процессом). */
export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  notificationsEnabled: true,
  deadlineThresholdHours: 24,
  onboarded: false,
};

// ------------------------------------------------------------
// Контракт preload-моста (contextBridge)
// ------------------------------------------------------------

/**
 * API, доступный renderer-процессу через window.taskApi.
 * Внутри Electron реализуется preload-скриптом; при разработке
 * в обычном браузере — localStorage-адаптером (см. src/lib/localStorageApi.ts).
 * window и menu опциональны: в браузерном фолбэке их нет.
 */
export interface TaskApi {
  platform: string;
  tasks: {
    list(): Promise<Task[]>;
    create(input: TaskInput): Promise<Task>;
    update(id: string, patch: Partial<TaskInput>): Promise<Task>;
    remove(id: string): Promise<boolean>;
  };
  settings: {
    getAll(): Promise<Settings>;
    set(patch: Partial<Settings>): Promise<Settings>;
  };
  window?: {
    minimize(): void;
    toggleMaximize(): void;
    close(): void;
    onStateChange(cb: (state: WindowState) => void): () => void;
  };
  menu?: {
    onAction(cb: (action: MenuAction) => void): () => void;
  };
}

declare global {
  interface Window {
    taskApi?: TaskApi;
  }
}
// ============================================================
// [END: Общие типы приложения]
// ============================================================
