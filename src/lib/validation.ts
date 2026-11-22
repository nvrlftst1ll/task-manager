// ============================================================
// [START: Чистая валидация задач]
// Модуль изоморфен (без DOM и Node API): используется формами
// renderer-процесса, main-процессом (server-side проверка IPC)
// и localStorage-адаптером. Благодаря этому правила валидации
// едины во всех слоях и покрыты unit-тестами.
// ============================================================
import {
  PRIORITIES,
  STATUSES,
  type Priority,
  type TaskInput,
  type TaskStatus,
} from '../types';

// ------------------------------------------------------------
// Константы ограничений
// ------------------------------------------------------------

export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 2000;
export const MAX_TAGS_COUNT = 10;
export const MAX_TAG_LENGTH = 24;

// ------------------------------------------------------------
// Валидация формы (renderer)
// ------------------------------------------------------------

/** Значения полей формы задачи. */
export interface TaskFormValues {
  title: string;
  description: string;
  /** Значение <input type="datetime-local"> либо ''. */
  deadline: string;
  priority: Priority;
  tags: string[];
}

/** Ошибки формы: ключ = поле, 'form' = общая ошибка (например, от IPC). */
export interface FormErrors {
  title?: string;
  deadline?: string;
  tags?: string;
  form?: string;
}

/**
 * Проверяет значения формы задачи.
 * @param values значения полей формы
 * @returns объект с ошибками; пустой объект = валидация пройдена
 */
export function validateTaskForm(values: TaskFormValues): FormErrors {
  const errors: FormErrors = {};

  const title = values.title.trim();
  if (title.length === 0) {
    errors.title = 'Укажите название задачи';
  } else if (title.length > MAX_TITLE_LENGTH) {
    errors.title = `Название: не больше ${MAX_TITLE_LENGTH} символов`;
  }

  if (values.description.length > MAX_DESCRIPTION_LENGTH) {
    errors.title = `Описание: не больше ${MAX_DESCRIPTION_LENGTH} символов`;
  }

  if (values.deadline !== '') {
    const ts = Date.parse(values.deadline);
    if (Number.isNaN(ts)) {
      errors.deadline = 'Некорректная дата дедлайна';
    } else if (ts < Date.now()) {
      errors.deadline = 'Дедлайн не может быть в прошлом';
    }
  }

  if (values.tags.length > MAX_TAGS_COUNT) {
    errors.tags = `Не больше ${MAX_TAGS_COUNT} тегов`;
  }

  return errors;
}

/**
 * Приводит значения формы к TaskInput для отправки в API.
 * @param values значения полей формы
 * @param status статус (используется при смене статуса через форму)
 */
export function toTaskInput(values: TaskFormValues, status?: TaskStatus): TaskInput {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    deadline: values.deadline === '' ? null : new Date(values.deadline).toISOString(),
    priority: values.priority,
    tags: [...values.tags],
    status: status ?? 'todo',
  };
}

// ------------------------------------------------------------
// Валидация API-входа (server-side, main + localStorage-адаптер)
// ------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Строгая проверка входных данных задачи на границе API.
 * @param input произвольное значение, пришедшее по IPC/из адаптера
 * @returns проверенный TaskInput
 * @throws Error с человекочитаемым сообщением на русском
 */
export function assertTaskInput(input: unknown): TaskInput {
  if (!isRecord(input)) {
    throw new Error('Некорректные данные задачи');
  }

  const { title, description, deadline, priority, tags, status } = input;

  if (typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('Укажите название задачи');
  }
  if (title.trim().length > MAX_TITLE_LENGTH) {
    throw new Error(`Название: не больше ${MAX_TITLE_LENGTH} символов`);
  }

  const desc = description ?? '';
  if (typeof desc !== 'string' || desc.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error(`Описание: не больше ${MAX_DESCRIPTION_LENGTH} символов`);
  }

  if (deadline !== null && deadline !== undefined) {
    if (typeof deadline !== 'string' || Number.isNaN(Date.parse(deadline))) {
      throw new Error('Некорректная дата дедлайна');
    }
  }

  if (priority !== undefined && !PRIORITIES.includes(priority as Priority)) {
    throw new Error('Некорректный приоритет');
  }

  if (status !== undefined && !STATUSES.includes(status as TaskStatus)) {
    throw new Error('Некорректный статус');
  }

  let normalizedTags: string[] = [];
  if (tags !== undefined && tags !== null) {
    if (!Array.isArray(tags)) {
      throw new Error('Некорректный список тегов');
    }
    normalizedTags = normalizeTags(tags);
    if (normalizedTags.length > MAX_TAGS_COUNT) {
      throw new Error(`Не больше ${MAX_TAGS_COUNT} тегов`);
    }
  }

  return {
    title: title.trim(),
    description: desc.trim(),
    deadline:
      deadline === null || deadline === undefined
        ? null
        : new Date(deadline as string).toISOString(),
    priority: (priority as Priority) ?? 'medium',
    tags: normalizedTags,
    status: (status as TaskStatus) ?? 'todo',
  };
}

/**
 * Нормализует список тегов: обрезает пробелы, отбрасывает пустые
 * и слишком длинные, убирает дубликаты.
 * @param tags исходный массив строк
 */
export function normalizeTags(tags: unknown[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    if (typeof raw !== 'string') continue;
    const tag = raw.trim();
    if (tag.length === 0 || tag.length > MAX_TAG_LENGTH) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(tag);
  }
  return result;
}
// ============================================================
// [END: Чистая валидация задач]
// ============================================================
