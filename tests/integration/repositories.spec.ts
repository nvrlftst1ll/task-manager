// ============================================================
// [START: Integration-тесты репозиториев (настоящий SQLite)]
// Запускаются на in-memory базе better-sqlite3. Нужен бинарник,
// собранный под локальный Node: перед прогоном скрипт
// test:integration выполняет `npm rebuild better-sqlite3`.
// ============================================================
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import {
  createSettingsRepository,
  createTaskRepository,
  prepareDatabase,
  type TaskRepository,
} from '../../electron/ipc/repositories';
import type { TaskInput } from '../../src/types';

let db: InstanceType<typeof Database>;
let repo: TaskRepository;

beforeEach(() => {
  db = new Database(':memory:');
  prepareDatabase(db);
  repo = createTaskRepository(db);
});

afterEach(() => {
  db.close();
});

const validInput: TaskInput = {
  title: 'Интеграционная задача',
  description: 'проверка CRUD',
  deadline: new Date(Date.now() + 3_600_000).toISOString(),
  priority: 'high',
  tags: ['тест', 'инфра'],
  status: 'todo',
};

describe('TaskRepository', () => {
  it('полный CRUD-цикл: create → list → update → remove', () => {
    const created = repo.create(validInput);
    expect(created.title).toBe('Интеграционная задача');
    expect(created.tags).toEqual(['тест', 'инфра']);

    const listed = repo.list();
    expect(listed).toHaveLength(1);

    const updated = repo.update(created.id, { status: 'done', priority: 'low' });
    expect(updated.status).toBe('done');
    expect(updated.priority).toBe('low');
    expect(updated.title).toBe('Интеграционная задача');
    expect(updated.updatedAt >= created.updatedAt).toBe(true);

    expect(repo.remove(created.id)).toBe(true);
    expect(repo.list()).toHaveLength(0);
    expect(repo.remove(created.id)).toBe(false);
  });

  it('теги переживают JSON-сериализацию в SQLite; дубликаты нормализуются', () => {
    const created = repo.create({ ...validInput, tags: ['работа', 'дом', 'работа'] });
    expect(repo.get(created.id)?.tags).toEqual(['работа', 'дом']);
  });

  it('update несуществующей задачи выбрасывает ошибку', () => {
    expect(() => repo.update('нет-такого-id', { title: 'x' })).toThrow('Задача не найдена');
  });

  it.each([
    ['пустое название', { ...validInput, title: '' }],
    ['неверный приоритет', { ...validInput, priority: 'mega' as never }],
    ['сломанный дедлайн', { ...validInput, deadline: 'не-дата' }],
  ])('server-side валидация отклоняет: %s', (_, input) => {
    expect(() => repo.create(input)).toThrow();
  });

  it('findWithDeadlines: только незакрытые задачи с дедлайном', () => {
    const withDeadline = repo.create(validInput);
    repo.create({ ...validInput, title: 'Без дедлайна', deadline: null, tags: [] });
    const done = repo.create({ ...validInput, title: 'Закрытая', status: 'done', tags: [] });

    const upcoming = repo.findWithDeadlines();
    expect(upcoming.map((t) => t.id)).toEqual([withDeadline.id]);
    expect(upcoming.some((t) => t.id === done.id)).toBe(false);
  });

  it('list сортирует: срочные сверху, без дедлайна — в конце', () => {
    const later = repo.create({
      ...validInput,
      deadline: new Date(Date.now() + 7_200_000).toISOString(),
      tags: [],
    });
    const sooner = repo.create({ ...validInput, title: 'Скоро', tags: [] });
    const none = repo.create({ ...validInput, title: 'Когда-нибудь', deadline: null, tags: [] });

    expect(repo.list().map((t) => t.id)).toEqual([sooner.id, later.id, none.id]);
  });
});

describe('SettingsRepository', () => {
  it('write + read: значения переживают запись', () => {
    const settings = createSettingsRepository(db);
    settings.write({ theme: 'dark', onboarded: true, deadlineThresholdHours: 6 });

    expect(settings.read()).toEqual({
      theme: 'dark',
      notificationsEnabled: true, // не меняли — осталось дефолтным
      deadlineThresholdHours: 6,
      onboarded: true,
    });
  });

  it('read возвращает дефолты на пустой базе', () => {
    expect(createSettingsRepository(db).read()).toEqual({
      theme: 'system',
      notificationsEnabled: true,
      deadlineThresholdHours: 24,
      onboarded: false,
    });
  });

  it.each([
    ['неверная тема', { theme: 'неон' as never }],
    ['неверный порог', { deadlineThresholdHours: 7 as never }],
    ['не-булев флаг', { onboarded: 'да' as never }],
  ])('валидация отклоняет патч: %s', (_, patch) => {
    const settings = createSettingsRepository(db);
    expect(() => settings.write(patch)).toThrow();
  });
});
// ============================================================
// [END: Integration-тесты репозиториев]
// ============================================================
