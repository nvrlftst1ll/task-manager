// ============================================================
// [START: Репозитории задач и настроек (чистый better-sqlite3)]
// Модуль НЕ импортирует electron — только better-sqlite3 и общие
// типы. Благодаря этому он полностью покрыт integration-тестами
// (vitest + in-memory база) без запуска Electron.
// ============================================================
import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import {
  DEADLINE_THRESHOLDS,
  DEFAULT_SETTINGS,
  type Settings,
  type Task,
  type TaskInput,
  type ThemeMode,
} from '../../src/types';
import { assertTaskInput } from '../../src/lib/validation';

/** Сырая строка таблицы tasks. */
interface TaskRow {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  priority: string;
  /** Теги упакованы в JSON-строку (SQLite не хранит массивы). */
  tags: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Создаёт схему БД (идемпотентно — безопасно при каждом запуске).
 * @param db открытое соединение better-sqlite3
 */
export function prepareDatabase(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      deadline    TEXT,
      priority    TEXT NOT NULL DEFAULT 'medium',
      tags        TEXT NOT NULL DEFAULT '[]',
      status      TEXT NOT NULL DEFAULT 'todo',
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_status   ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

/**
 * Преобразует строку БД в доменную модель Task.
 * @param row строка таблицы tasks
 */
export function rowToTask(row: TaskRow): Task {
  let tags: string[] = [];
  try {
    const parsed: unknown = JSON.parse(row.tags);
    if (Array.isArray(parsed)) tags = parsed.filter((t): t is string => typeof t === 'string');
  } catch {
    // повреждённый JSON в tags не должен ронять приложение — начинаем с пустого списка
    tags = [];
  }
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    deadline: row.deadline,
    priority: row.priority as Task['priority'],
    tags,
    status: row.status as Task['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Контракт репозитория задач (используется и в integration-тестах). */
export interface TaskRepository {
  list(): Task[];
  get(id: string): Task | null;
  create(input: unknown): Task;
  update(id: string, patch: unknown): Task;
  remove(id: string): boolean;
  /** Все незакрытые задачи с дедлайном (для наблюдателя уведомлений). */
  findWithDeadlines(): Task[];
}

/**
 * Создаёт репозиторий задач поверх готового соединения.
 * @param db открытое соединение better-sqlite3 (схема уже создана)
 */
export function createTaskRepository(db: Database.Database): TaskRepository {
  const selectById = db.prepare('SELECT * FROM tasks WHERE id = ?');
  // Задачи без дедлайна — в конце; внутри — по возрастанию дедлайна
  const selectAllSorted = db.prepare(
    `SELECT * FROM tasks
     ORDER BY (deadline IS NULL) ASC, datetime(deadline) ASC, datetime(created_at) DESC`
  );
  const selectWithDeadlines = db.prepare(
    `SELECT * FROM tasks WHERE status != 'done' AND deadline IS NOT NULL`
  );
  const insertTask = db.prepare(
    `INSERT INTO tasks (id, title, description, deadline, priority, tags, status, created_at, updated_at)
     VALUES (@id, @title, @description, @deadline, @priority, @tags, @status, @created_at, @updated_at)`
  );
  const updateTask = db.prepare(
    `UPDATE tasks
     SET title = @title, description = @description, deadline = @deadline,
         priority = @priority, tags = @tags, status = @status, updated_at = @updated_at
     WHERE id = @id`
  );
  const deleteTask = db.prepare('DELETE FROM tasks WHERE id = ?');

  function assertRow(row: TaskRow | undefined): Task {
    if (!row) throw new Error('Задача не найдена');
    return rowToTask(row);
  }

  return {
    list(): Task[] {
      return (selectAllSorted.all() as TaskRow[]).map(rowToTask);
    },

    get(id: string): Task | null {
      const row = selectById.get(id) as TaskRow | undefined;
      return row ? rowToTask(row) : null;
    },

    create(input: unknown): Task {
      const taskInput = assertTaskInput(input);
      const now = new Date().toISOString();
      const task: Task = {
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
        ...taskInput,
      };
      insertTask.run({
        id: task.id,
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        priority: task.priority,
        tags: JSON.stringify(task.tags),
        status: task.status,
        created_at: task.createdAt,
        updated_at: task.updatedAt,
      });
      return task;
    },

    update(id: string, patch: unknown): Task {
      const existing = assertRow(selectById.get(id) as TaskRow | undefined);
      // Сливаем патч с текущими значениями и прогоняем через полную валидацию —
      // так некорректный патч не сможет «испортить» задачу частично
      const merged = {
        title: existing.title,
        description: existing.description,
        deadline: existing.deadline,
        priority: existing.priority,
        tags: existing.tags,
        status: existing.status,
        ...(typeof patch === 'object' && patch !== null ? patch : {}),
      };
      const taskInput: TaskInput = assertTaskInput(merged);
      const updated: Task = {
        ...existing,
        ...taskInput,
        updatedAt: new Date().toISOString(),
      };
      updateTask.run({
        id: updated.id,
        title: updated.title,
        description: updated.description,
        deadline: updated.deadline,
        priority: updated.priority,
        tags: JSON.stringify(updated.tags),
        status: updated.status,
        updated_at: updated.updatedAt,
      });
      return updated;
    },

    remove(id: string): boolean {
      const info = deleteTask.run(id);
      return info.changes > 0;
    },

    findWithDeadlines(): Task[] {
      return (selectWithDeadlines.all() as TaskRow[]).map(rowToTask);
    },
  };
}

// ------------------------------------------------------------
// Настройки
// ------------------------------------------------------------

/** Контракт репозитория настроек. */
export interface SettingsRepository {
  read(): Settings;
  write(patch: unknown): Settings;
}

const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'system'];

/**
 * Создаёт репозиторий настроек поверх готового соединения.
 * Настройки хранятся как key/value, сериализация — строками.
 * @param db открытое соединение better-sqlite3
 */
export function createSettingsRepository(db: Database.Database): SettingsRepository {
  const selectAll = db.prepare('SELECT key, value FROM settings');
  const upsert = db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  );

  function read(): Settings {
    const rows = selectAll.all() as { key: string; value: string }[];
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const threshold = Number(map.get('deadlineThresholdHours'));
    return {
      theme: (THEME_MODES as readonly string[]).includes(map.get('theme') ?? '')
        ? (map.get('theme') as ThemeMode)
        : DEFAULT_SETTINGS.theme,
      notificationsEnabled: map.has('notificationsEnabled')
        ? map.get('notificationsEnabled') === 'true'
        : DEFAULT_SETTINGS.notificationsEnabled,
      deadlineThresholdHours: (DEADLINE_THRESHOLDS as readonly number[]).includes(threshold)
        ? (threshold as Settings['deadlineThresholdHours'])
        : DEFAULT_SETTINGS.deadlineThresholdHours,
      onboarded: map.get('onboarded') === 'true',
    };
  }

  function write(patch: unknown): Settings {
    if (typeof patch !== 'object' || patch === null) {
      throw new Error('Некорректные настройки');
    }
    const entries: Array<[string, string]> = [];
    const p = patch as Record<string, unknown>;

    if (p.theme !== undefined) {
      if (!(THEME_MODES as readonly string[]).includes(p.theme as string)) {
        throw new Error('Некорректная тема оформления');
      }
      entries.push(['theme', String(p.theme)]);
    }
    if (p.notificationsEnabled !== undefined) {
      if (typeof p.notificationsEnabled !== 'boolean') {
        throw new Error('Некорректное значение уведомлений');
      }
      entries.push(['notificationsEnabled', String(p.notificationsEnabled)]);
    }
    if (p.deadlineThresholdHours !== undefined) {
      if (!(DEADLINE_THRESHOLDS as readonly number[]).includes(Number(p.deadlineThresholdHours))) {
        throw new Error('Некорректный порог дедлайна');
      }
      entries.push(['deadlineThresholdHours', String(p.deadlineThresholdHours)]);
    }
    if (p.onboarded !== undefined) {
      if (typeof p.onboarded !== 'boolean') {
        throw new Error('Некорректное значение флага онбординга');
      }
      entries.push(['onboarded', String(p.onboarded)]);
    }

    // Атомарно: либо записаны все ключи патча, либо ни один
    const writeAll = db.transaction(() => {
      for (const [key, value] of entries) upsert.run(key, value);
    });
    writeAll();
    return read();
  }

  return { read, write };
}

// ============================================================
// [END: Репозитории задач и настроек]
// ============================================================
