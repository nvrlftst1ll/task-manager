// ============================================================
// [START: Unit-тесты валидации]
// Параметризованные прогоны: корректные данные, граничные
// значения и заведомо некорректные входы.
// ============================================================
import { describe, expect, it } from 'vitest';
import {
  MAX_TAGS_COUNT,
  MAX_TITLE_LENGTH,
  assertTaskInput,
  normalizeTags,
  toTaskInput,
  validateTaskForm,
  type TaskFormValues,
} from '../../src/lib/validation';

const validForm: TaskFormValues = {
  title: 'Подготовить релиз',
  description: '',
  deadline: '',
  priority: 'medium',
  tags: [],
};

describe('validateTaskForm (форма задачи)', () => {
  it('принимает корректную форму без ошибок', () => {
    expect(validateTaskForm(validForm)).toEqual({});
  });

  it('показывает ошибку при пустом названии (только пробелы)', () => {
    const errors = validateTaskForm({ ...validForm, title: '   ' });
    expect(errors.title).toBe('Укажите название задачи');
  });

  it(`показывает ошибку при названии длиннее ${MAX_TITLE_LENGTH} символов`, () => {
    const errors = validateTaskForm({ ...validForm, title: 'а'.repeat(MAX_TITLE_LENGTH + 1) });
    expect(errors.title).toContain('Название');
  });

  it('принимает название ровно в лимите символов', () => {
    const errors = validateTaskForm({ ...validForm, title: 'а'.repeat(MAX_TITLE_LENGTH) });
    expect(errors.title).toBeUndefined();
  });

  it.each([
    ['некорректная строка', 'не-дата-вовсе', 'Некорректная дата дедлайна'],
    [
      'дедлайн в прошлом',
      '2000-01-01T10:00',
      'Дедлайн не может быть в прошлом',
    ],
  ])('ошибка дедлайна: %s', (_, deadline, expected) => {
    const errors = validateTaskForm({ ...validForm, deadline });
    expect(errors.deadline).toBe(expected);
  });

  it('принимает дедлайн в будущем', () => {
    const future = new Date(Date.now() + 86_400_000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(
      future.getDate()
    )}T${pad(future.getHours())}:${pad(future.getMinutes())}`;
    expect(validateTaskForm({ ...validForm, deadline: local }).deadline).toBeUndefined();
  });

  it(`ограничивает количество тегов (${MAX_TAGS_COUNT})`, () => {
    const tags = Array.from({ length: MAX_TAGS_COUNT + 1 }, (_, i) => `тег-${i}`);
    const errors = validateTaskForm({ ...validForm, tags });
    expect(errors.tags).toContain('Не больше');
  });
});

describe('assertTaskInput (граница API)', () => {
  it('нормализует корректный вход', () => {
    const result = assertTaskInput({
      title: '  Проверка  ',
      description: undefined,
      deadline: undefined,
      priority: undefined,
      tags: undefined,
    });
    expect(result).toEqual({
      title: 'Проверка',
      description: '',
      deadline: null,
      priority: 'medium',
      tags: [],
      status: 'todo',
    });
  });

  it.each([
    ['null', null],
    ['число', 42],
    ['массив', []],
    ['пустой объект', {}],
    ['пустое название', { title: '   ' }],
    ['строковое название', { title: 123 }],
    ['неверный приоритет', { title: 'x', priority: 'urgent' }],
    ['неверный статус', { title: 'x', status: 'archived' }],
    ['теги не массивом', { title: 'x', tags: 'работа' }],
    ['сломанная дата', { title: 'x', deadline: 'завтра' }],
    [
      'слишком много тегов',
      { title: 'x', tags: Array.from({ length: MAX_TAGS_COUNT + 1 }, (_, i) => `t${i}`) },
    ],
  ])('отклоняет некорректный вход: %s', (_, input) => {
    expect(() => assertTaskInput(input)).toThrow();
  });

  it('преобразует дату в ISO 8601', () => {
    const result = assertTaskInput({
      title: 'x',
      description: '',
      deadline: '2026-03-01T10:00:00',
      priority: 'high',
      tags: ['релиз'],
      status: 'in_progress',
    });
    expect(result.deadline).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.priority).toBe('high');
    expect(result.status).toBe('in_progress');
  });
});

describe('normalizeTags', () => {
  it('обрезает пробелы, убирает дубликаты без учёта регистра', () => {
    expect(normalizeTags([' Работа ', 'работа', 'РЕЛИЗ', '', '  '])).toEqual([
      'Работа',
      'РЕЛИЗ',
    ]);
  });

  it('пропускает не-строки и слишком длинные теги', () => {
    const mixed: unknown[] = [1, null, 'ок', 'а'.repeat(25), true];
    expect(normalizeTags(mixed)).toEqual(['ок']);
  });
});

describe('toTaskInput', () => {
  it('пустой дедлайн становится null, название обрезается', () => {
    const input = toTaskInput({ ...validForm, title: '  Заголовок  ' });
    expect(input.title).toBe('Заголовок');
    expect(input.deadline).toBeNull();
    expect(input.status).toBe('todo');
  });

  it('дедлайн конвертируется в ISO, статус передаётся', () => {
    const input = toTaskInput({ ...validForm, deadline: '2026-03-01T10:00' }, 'done');
    expect(input.deadline).toMatch(/^2026-03-01T/);
    expect(input.status).toBe('done');
  });
});
// ============================================================
// [END: Unit-тесты валидации]
// ============================================================
