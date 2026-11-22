// ============================================================
// [START: Unit-тесты localStorage-адаптера]
// Адаптер работает с внедрённым хранилищем: вместо window.localStorage
// подставляется Map-заглушка — тесты не зависят от браузера.
// ============================================================
import { describe, expect, it } from 'vitest';
import { LocalStorageApi, type StorageLike } from '../../src/lib/localStorageApi';
import type { TaskInput } from '../../src/types';

class MemoryStorage implements StorageLike {
  private map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }
}

const validInput: TaskInput = {
  title: 'Подготовить демо',
  description: 'Показать канбан',
  deadline: new Date(Date.now() + 86_400_000).toISOString(),
  priority: 'high',
  tags: ['демо'],
  status: 'todo',
};

describe('LocalStorageApi — задачи', () => {
  it('создаёт задачу и возвращает её из списка', async () => {
    const api = new LocalStorageApi(new MemoryStorage());
    const created = await api.tasks.create(validInput);

    expect(created.id).toBeTruthy();
    expect(created.title).toBe('Подготовить демо');
    expect(created.createdAt).toBe(created.updatedAt);

    const all = await api.tasks.list();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(created.id);
  });

  it('обновляет только переданные поля', async () => {
    const api = new LocalStorageApi(new MemoryStorage());
    const created = await api.tasks.create(validInput);

    const updated = await api.tasks.update(created.id, { status: 'done', priority: 'low' });
    expect(updated.status).toBe('done');
    expect(updated.priority).toBe('low');
    expect(updated.title).toBe('Подготовить демо'); // не затронуто патчем
    expect(updated.tags).toEqual(['демо']);
  });

  it('удаляет задачу и сообщает об отсутствии', async () => {
    const api = new LocalStorageApi(new MemoryStorage());
    const created = await api.tasks.create(validInput);

    expect(await api.tasks.remove(created.id)).toBe(true);
    expect(await api.tasks.list()).toHaveLength(0);
    expect(await api.tasks.remove(created.id)).toBe(false);
  });

  it('обновление несуществующей задачи — ошибка', async () => {
    const api = new LocalStorageApi(new MemoryStorage());
    await expect(api.tasks.update('нет-такого-id', { title: 'x' })).rejects.toThrow(
      'Задача не найдена'
    );
  });

  it.each([
    ['пустое название', { ...validInput, title: '   ' }],
    ['неверный приоритет', { ...validInput, priority: 'urgent' as never }],
    ['сломанная дата', { ...validInput, deadline: 'завтра' }],
  ])('отклоняет некорректный вход: %s', async (_, input) => {
    const api = new LocalStorageApi(new MemoryStorage());
    await expect(api.tasks.create(input)).rejects.toThrow();
  });

  it('переживает «перезапуск»: данные читаются из того же хранилища', async () => {
    const storage = new MemoryStorage();
    const first = new LocalStorageApi(storage);
    const created = await first.tasks.create(validInput);

    const second = new LocalStorageApi(storage); // новое «приложение»
    const all = await second.tasks.list();
    expect(all.map((t) => t.id)).toEqual([created.id]);
  });
});

describe('LocalStorageApi — настройки', () => {
  it('возвращает дефолты при пустом хранилище', async () => {
    const api = new LocalStorageApi(new MemoryStorage());
    const settings = await api.settings.getAll();
    expect(settings.theme).toBe('system');
    expect(settings.notificationsEnabled).toBe(true);
    expect(settings.deadlineThresholdHours).toBe(24);
    expect(settings.onboarded).toBe(false);
  });

  it('сохраняет и возвращает настройки', async () => {
    const api = new LocalStorageApi(new MemoryStorage());
    const saved = await api.settings.set({ theme: 'dark', onboarded: true });

    expect(saved.theme).toBe('dark');
    expect(saved.onboarded).toBe(true);
    expect(await api.settings.getAll()).toEqual(saved);
  });

  it.each([
    ['неверная тема', { theme: 'неон' as never }],
    ['неверный порог', { deadlineThresholdHours: 5 as never }],
  ])('отклоняет некорректный патч: %s', async (_, patch) => {
    const api = new LocalStorageApi(new MemoryStorage());
    await expect(api.settings.set(patch)).rejects.toThrow();
  });
});

describe('LocalStorageApi — демо-данные', () => {
  it('ensureSeed наполняет хранилище однократно', async () => {
    const storage = new MemoryStorage();
    const api = new LocalStorageApi(storage);
    api.ensureSeed();
    api.ensureSeed(); // повторный вызов ничего не должен добавить

    const all = await api.tasks.list();
    expect(all.length).toBe(4);
    expect(all.some((t) => t.status === 'done')).toBe(true);
  });
});
// ============================================================
// [END: Unit-тесты localStorage-адаптера]
// ============================================================
