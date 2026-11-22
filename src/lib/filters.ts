// ============================================================
// [START: Фильтрация, сортировка и агрегаты задач]
// Чистые функции без побочных эффектов — покрыты unit-тестами
// (в том числе параметризованными прогонами на граничных датах).
// ============================================================
import type { Priority, Task, TaskStatus } from '../types';

/** Фильтр по дате дедлайна. */
export type DateFilter = 'all' | 'today' | 'week' | 'overdue';

/** Полный набор фильтров панели поиска. */
export interface TaskFilters {
  search: string;
  status: 'all' | TaskStatus;
  priority: 'all' | Priority;
  tag: 'all' | string;
  date: DateFilter;
}

export const DEFAULT_FILTERS: TaskFilters = {
  search: '',
  status: 'all',
  priority: 'all',
  tag: 'all',
  date: 'all',
};

/**
 * Проверяет, активен ли хотя бы один фильтр (для кнопки сброса).
 * @param filters текущие фильтры
 */
export function hasActiveFilters(filters: TaskFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.tag !== 'all' ||
    filters.date !== 'all'
  );
}

/** Совпадают ли две даты по локальному календарному дню. */
function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Фильтрует задачи по всем активным условиям.
 * Поиск регистронезависимый: по названию, описанию и тегам.
 * @param tasks исходный список
 * @param filters активные фильтры
 */
export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  const query = filters.search.trim().toLowerCase();

  return tasks.filter((task) => {
    if (filters.status !== 'all' && task.status !== filters.status) return false;
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    if (filters.tag !== 'all' && !task.tags.includes(filters.tag)) return false;

    if (query !== '') {
      const haystack = [task.title, task.description, ...task.tags].join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (filters.date !== 'all') {
      if (!task.deadline) return false;
      const deadline = new Date(task.deadline);
      if (Number.isNaN(deadline.getTime())) return false;
      const now = new Date();
      if (filters.date === 'today') {
        if (!isSameLocalDay(deadline, now)) return false;
      } else if (filters.date === 'week') {
        const weekAhead = new Date(now.getTime() + 7 * 24 * 3_600_000);
        if (!(deadline >= now && deadline <= weekAhead)) return false;
      } else if (filters.date === 'overdue') {
        if (!(deadline.getTime() < now.getTime())) return false;
      }
    }

    return true;
  });
}

/**
 * Сортирует задачи: сначала срочные (дедлайн по возрастанию),
 * задачи без дедлайна — в конце, при равенстве — новые сверху.
 * @param tasks список задач
 */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const aTime = a.deadline ? Date.parse(a.deadline) : null;
    const bTime = b.deadline ? Date.parse(b.deadline) : null;
    if (aTime === null && bTime === null) {
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    }
    if (aTime === null) return 1;
    if (bTime === null) return -1;
    if (aTime === bTime) {
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    }
    return aTime - bTime;
  });
}

/**
 * Собирает уникальные теги всех задач (для выпадающего списка фильтра).
 * @param tasks список задач
 */
export function collectTags(tasks: Task[]): string[] {
  const set = new Set<string>();
  for (const task of tasks) {
    for (const tag of task.tags) set.add(tag);
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'ru'));
}
// ============================================================
// [END: Фильтрация, сортировка и агрегаты задач]
// ============================================================
