// ============================================================
// [START: Unit-тесты фильтрации и сортировки]
// Задачи с относительными датами генерируются в прогонах —
// каждый запуск получает актуальные «сегодня/неделя/просрочено».
// ============================================================
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FILTERS,
  collectTags,
  filterTasks,
  hasActiveFilters,
  sortTasks,
  type TaskFilters,
} from '../../src/lib/filters';
import type { Task } from '../../src/types';

let idSeq = 0;

/** Создаёт задачу с дедлайном, смещённым относительно «сейчас» (в часах). */
function makeTask(overrides: Partial<Task> = {}, deadlineOffsetHours: number | null = null): Task {
  const now = new Date().toISOString();
  const deadline =
    deadlineOffsetHours === null
      ? null
      : new Date(Date.now() + deadlineOffsetHours * 3_600_000).toISOString();
  return {
    id: `task-${++idSeq}`,
    title: 'Задача',
    description: '',
    deadline,
    priority: 'medium',
    tags: [],
    status: 'todo',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('filterTasks', () => {
  const tasks = [
    makeTask({ title: 'Купить кофе', tags: ['дом'] }, null),
    makeTask({ title: 'Ревью PR', description: 'ветка feature', tags: ['работа'] }, 2),
    makeTask({ title: 'Срочный фикс', priority: 'high', tags: ['работа', 'инфра'] }, -24),
    makeTask({ title: 'Релиз v2', status: 'done' }, 48),
  ];

  it('без фильтров возвращает всё', () => {
    expect(filterTasks(tasks, DEFAULT_FILTERS)).toHaveLength(4);
  });

  it.each([
    ['по статусу', { status: 'done' as const }, ['Релиз v2']],
    ['по приоритету', { priority: 'high' as const }, ['Срочный фикс']],
    ['по тегу', { tag: 'работа' }, ['Ревью PR', 'Срочный фикс']],
    ['поиск по названию', { search: 'кофе' }, ['Купить кофе']],
    ['поиск по описанию', { search: 'feature' }, ['Ревью PR']],
    ['поиск по тегу', { search: 'инфра' }, ['Срочный фикс']],
    ['поиск без учёта регистра', { search: 'РЕВЬЮ' }, ['Ревью PR']],
    ['просроченные', { date: 'overdue' as const }, ['Срочный фикс']],
    ['ближайшая неделя', { date: 'week' as const }, ['Ревью PR', 'Релиз v2']],
  ])('фильтр %s', (_, patch, expected) => {
    const filters: TaskFilters = { ...DEFAULT_FILTERS, ...patch };
    expect(filterTasks(tasks, filters).map((t) => t.title)).toEqual(expected);
  });

  it('фильтр «сегодня»: дедлайн «прямо сейчас» в текущем дне, +24 ч — уже нет', () => {
    const tasksNow = [
      makeTask({ title: 'Сейчас' }, 0),
      makeTask({ title: 'Через сутки' }, 24),
      makeTask({ title: 'Без даты' }, null),
    ];
    const visible = filterTasks(tasksNow, { ...DEFAULT_FILTERS, date: 'today' });
    expect(visible.map((t) => t.title)).toEqual(['Сейчас']);
  });

  it('комбинирует условия (И)', () => {
    const visible = filterTasks(tasks, {
      ...DEFAULT_FILTERS,
      priority: 'medium',
      tag: 'работа',
    });
    expect(visible.map((t) => t.title)).toEqual(['Ревью PR']);
  });

  it('не находит ничего по несуществующей подстроке', () => {
    expect(filterTasks(tasks, { ...DEFAULT_FILTERS, search: 'зеппелин' })).toEqual([]);
  });
});

describe('sortTasks', () => {
  it('раньше дедлайн — выше в колонке; без дедлайна — в конце', () => {
    const tasks = [
      makeTask({ title: 'Позже' }, 48),
      makeTask({ title: 'Раньше' }, 1),
      makeTask({ title: 'Без дедлайна' }, null),
      makeTask({ title: 'Средне' }, 24),
    ];
    const titles = sortTasks(tasks).map((t) => t.title);
    expect(titles).toEqual(['Раньше', 'Средне', 'Позже', 'Без дедлайна']);
  });

  it('при равных дедлайнах новые задачи выше', () => {
    const base = { deadline: new Date(Date.now() + 3_600_000).toISOString() };
    const older = makeTask({ ...base, title: 'Старая', createdAt: '2026-01-01T00:00:00.000Z' });
    const newer = makeTask({ ...base, title: 'Новая', createdAt: '2026-02-01T00:00:00.000Z' });
    expect(sortTasks([older, newer]).map((t) => t.title)).toEqual(['Новая', 'Старая']);
  });

  it('не мутирует исходный массив', () => {
    const tasks = [makeTask({}, 5), makeTask({}, 1)];
    const copy = [...tasks];
    sortTasks(tasks);
    expect(tasks).toEqual(copy);
  });
});

describe('collectTags', () => {
  it('собирает уникальные теги и сортирует по алфавиту', () => {
    const tasks = [
      makeTask({ tags: ['работа', 'релиз'] }),
      makeTask({ tags: ['работа', 'дом'] }),
    ];
    expect(collectTags(tasks)).toEqual(['дом', 'работа', 'релиз']);
  });

  it('возвращает пустой массив без тегов', () => {
    expect(collectTags([makeTask()])).toEqual([]);
  });
});

describe('hasActiveFilters', () => {
  it.each([
    ['дефолт', DEFAULT_FILTERS, false],
    ['текст', { ...DEFAULT_FILTERS, search: 'а' }, true],
    ['статус', { ...DEFAULT_FILTERS, status: 'todo' }, true],
    ['дата', { ...DEFAULT_FILTERS, date: 'today' }, true],
    ['пробельный поиск не считается', { ...DEFAULT_FILTERS, search: '   ' }, false],
  ])('%s → %s', (_, filters, expected) => {
    expect(hasActiveFilters(filters as TaskFilters)).toBe(expected);
  });
});
// ============================================================
// [END: Unit-тесты фильтрации]
// ============================================================
