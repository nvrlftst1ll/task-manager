// ============================================================
// [START: Панель поиска и фильтров]
// Ctrl+F (и меню «Найти задачи») фокусируют поле через
// searchFocusSignal из ui-стора. Фильтрация происходит в
// BoardPage чистой функцией filterTasks.
// ============================================================
import { useEffect, useRef } from 'react';
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from '../types';
import { hasActiveFilters, type TaskFilters } from '../lib/filters';
import { useUiStore } from '../store/uiStore';
import { IconRotateCcw, IconSearch } from './icons';

interface SearchFilterBarProps {
  filters: TaskFilters;
  onChange: (next: TaskFilters) => void;
  /** Все теги текущих задач (для выпадающего списка). */
  tags: string[];
  visibleCount: number;
  totalCount: number;
}

const DATE_OPTIONS: ReadonlyArray<[TaskFilters['date'], string]> = [
  ['all', 'Все даты'],
  ['today', 'Сегодня'],
  ['week', 'Следующие 7 дней'],
  ['overdue', 'Просроченные'],
];

export function SearchFilterBar({
  filters,
  onChange,
  tags,
  visibleCount,
  totalCount,
}: SearchFilterBarProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const focusSignal = useUiStore((s) => s.searchFocusSignal);

  // Импульс из хоткея/меню → фокус в поле поиска
  useEffect(() => {
    if (focusSignal > 0) searchRef.current?.focus();
  }, [focusSignal]);

  const set = (patch: Partial<TaskFilters>) => onChange({ ...filters, ...patch });
  const active = hasActiveFilters(filters);

  return (
    <div className="toolbar">
      <div className="toolbar__row">
        <div className="search">
          <IconSearch size={15} className="search__icon" />
          <input
            ref={searchRef}
            type="search"
            className="search__input"
            placeholder="Поиск по названию, описанию, тегам…  (Ctrl+F)"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            aria-label="Поиск задач"
          />
        </div>

        <span className="toolbar__meta" aria-live="polite">
          Показано: {visibleCount} из {totalCount}
        </span>

        {active && (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => onChange({ search: '', status: 'all', priority: 'all', tag: 'all', date: 'all' })}
          >
            <IconRotateCcw size={14} />
            Сбросить
          </button>
        )}
      </div>

      <div className="toolbar__row toolbar__row--filters">
        <select
          className="select"
          value={filters.status}
          onChange={(e) => set({ status: e.target.value as TaskFilters['status'] })}
          aria-label="Фильтр по статусу"
        >
          <option value="all">Все статусы</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>

        <select
          className="select"
          value={filters.priority}
          onChange={(e) => set({ priority: e.target.value as TaskFilters['priority'] })}
          aria-label="Фильтр по приоритету"
        >
          <option value="all">Любой приоритет</option>
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABELS[priority]}
            </option>
          ))}
        </select>

        <select
          className="select"
          value={filters.tag}
          onChange={(e) => set({ tag: e.target.value })}
          aria-label="Фильтр по тегу"
          disabled={tags.length === 0}
        >
          <option value="all">Все теги</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              #{tag}
            </option>
          ))}
        </select>

        <select
          className="select"
          value={filters.date}
          onChange={(e) => set({ date: e.target.value as TaskFilters['date'] })}
          aria-label="Фильтр по дате дедлайна"
        >
          {DATE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
// ============================================================
// [END: Панель поиска и фильтров]
// ============================================================
