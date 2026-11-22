// ============================================================
// [START: localStorage-адаптер — фолбэк для браузерной разработки]
// Реализует тот же контракт TaskApi, что и preload-мост Electron,
// поэтому приложение целиком запускается в обычном браузере
// (`npm run dev:renderer`). Хранилище внедряется снаружи —
// в unit-тестах подставляется Map-заглушка.
// ============================================================
import {
  DEFAULT_SETTINGS,
  type Settings,
  type Task,
  type TaskApi,
  type TaskInput,
  type ThemeMode,
} from '../types';
import { assertTaskInput } from './validation';

export type { TaskApi };

/** Минимальный контракт хранилища (достаточно для адаптера). */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const TASKS_KEY = 'tm:tasks';
const SETTINGS_KEY = 'tm:settings';
const SEED_FLAG_KEY = 'tm:seeded';

const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'system'];
const THRESHOLDS: readonly number[] = [1, 6, 12, 24];

/** Генерирует id с фолбэком для окружений без crypto.randomUUID. */
function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Формирует задачу из значений полей существующей задачи и патча.
 * Вся валидация — в общем assertTaskInput (как в main-процессе).
 */
function mergePatch(existing: Task, patch: Partial<TaskInput>): TaskInput {
  return assertTaskInput({
    title: existing.title,
    description: existing.description,
    deadline: existing.deadline,
    priority: existing.priority,
    tags: existing.tags,
    status: existing.status,
    ...patch,
  });
}

/** Адаптер TaskApi поверх Web Storage. */
export class LocalStorageApi implements TaskApi {
  readonly platform = 'browser';

  constructor(private readonly storage: StorageLike) {}

  private readTasks(): Task[] {
    try {
      const raw = this.storage.getItem(TASKS_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) ? (parsed as Task[]) : [];
    } catch (error) {
      console.error('[localStorage-api] не удалось прочитать задачи:', error);
      return [];
    }
  }

  private writeTasks(tasks: Task[]): void {
    this.storage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }

  private readSettings(): Settings {
    try {
      const raw = this.storage.getItem(SETTINGS_KEY);
      const parsed = raw ? (JSON.parse(raw) as Partial<Settings>) : {};
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (error) {
      console.error('[localStorage-api] не удалось прочитать настройки:', error);
      return { ...DEFAULT_SETTINGS };
    }
  }

  /** Однократно наполняет хранилище демо-задачами (только для браузера). */
  ensureSeed(): void {
    if (this.storage.getItem(SEED_FLAG_KEY) === 'true') return;
    if (this.readTasks().length > 0) {
      this.storage.setItem(SEED_FLAG_KEY, 'true');
      return;
    }
    const now = Date.now();
    const iso = (offsetHours: number) => new Date(now + offsetHours * 3_600_000).toISOString();
    const base = (title: string, offsetHours: number | null) => ({
      createdAt: iso(-24),
      updatedAt: iso(-24),
      ...(offsetHours === null ? { deadline: null } : { deadline: iso(offsetHours) }),
      title,
    });
    const seed: Task[] = [
      {
        ...base('Собрать релиз v1.0', 48),
        id: makeId(),
        description: 'Финальная проверка чеклиста релиза',
        priority: 'high',
        tags: ['релиз'],
        status: 'in_progress',
      },
      {
        ...base('Ревью PR #42', 6),
        id: makeId(),
        description: 'Смотри ветку feature/kanban',
        priority: 'medium',
        tags: ['работа'],
        status: 'todo',
      },
      {
        ...base('Купить кофе для команды', null),
        id: makeId(),
        description: '',
        priority: 'low',
        tags: ['дом'],
        status: 'todo',
      },
      {
        ...base('Настроить CI', -48),
        id: makeId(),
        description: 'GitHub Actions уже зелёный',
        priority: 'medium',
        tags: ['инфра'],
        status: 'done',
      },
    ];
    this.writeTasks(seed);
    this.storage.setItem(SEED_FLAG_KEY, 'true');
  }

  readonly tasks = {
    list: async (): Promise<Task[]> => this.readTasks(),

    create: async (input: TaskInput): Promise<Task> => {
      const taskInput = assertTaskInput(input);
      const now = new Date().toISOString();
      const task: Task = { id: makeId(), createdAt: now, updatedAt: now, ...taskInput };
      this.writeTasks([task, ...this.readTasks()]);
      return task;
    },

    update: async (id: string, patch: Partial<TaskInput>): Promise<Task> => {
      const tasks = this.readTasks();
      const index = tasks.findIndex((t) => t.id === id);
      if (index === -1) throw new Error('Задача не найдена');
      const taskInput = mergePatch(tasks[index], patch);
      const updated: Task = {
        ...tasks[index],
        ...taskInput,
        updatedAt: new Date().toISOString(),
      };
      const next = [...tasks];
      next[index] = updated;
      this.writeTasks(next);
      return updated;
    },

    remove: async (id: string): Promise<boolean> => {
      const tasks = this.readTasks();
      const next = tasks.filter((t) => t.id !== id);
      if (next.length === tasks.length) return false;
      this.writeTasks(next);
      return true;
    },
  };

  readonly settings = {
    getAll: async (): Promise<Settings> => this.readSettings(),

    set: async (patch: Partial<Settings>): Promise<Settings> => {
      // Валидация зеркалит main-процесс (repositories.ts)
      if (typeof patch === 'object' && patch !== null) {
        if (patch.theme !== undefined && !(THEME_MODES as readonly string[]).includes(patch.theme)) {
          throw new Error('Некорректная тема оформления');
        }
        if (
          patch.deadlineThresholdHours !== undefined &&
          !THRESHOLDS.includes(Number(patch.deadlineThresholdHours))
        ) {
          throw new Error('Некорректный порог дедлайна');
        }
      }
      const next = { ...this.readSettings(), ...patch };
      this.storage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    },
  };
}
// ============================================================
// [END: localStorage-адаптер]
// ============================================================
