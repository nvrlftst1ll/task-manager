// ============================================================
// [START: Главный экран — канбан-доска с панелью поиска]
// Фильтрация чистой функцией filterTasks (покрыта тестами).
// Отдельные пустые состояния: нет задач вообще / фильтр
// ничего не нашёл.
// ============================================================
import { useMemo, useState } from 'react';
import { DEFAULT_FILTERS, collectTags, filterTasks, hasActiveFilters, type TaskFilters } from '../lib/filters';
import { useTasksStore } from '../store/tasksStore';
import { useUiStore } from '../store/uiStore';
import { KanbanBoard } from '../components/KanbanBoard';
import { SearchFilterBar } from '../components/SearchFilterBar';
import { IconPlus, IconRotateCcw } from '../components/icons';

export function BoardPage() {
  const tasks = useTasksStore((s) => s.tasks);
  const loading = useTasksStore((s) => s.loading);
  const openForm = useUiStore((s) => s.openForm);
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);

  const visibleTasks = useMemo(() => filterTasks(tasks, filters), [tasks, filters]);
  const tags = useMemo(() => collectTags(tasks), [tasks]);
  const filtering = hasActiveFilters(filters);
  const nothingFound = tasks.length > 0 && visibleTasks.length === 0 && filtering;

  return (
    <div className="board-page">
      <SearchFilterBar
        filters={filters}
        onChange={setFilters}
        tags={tags}
        visibleCount={visibleTasks.length}
        totalCount={tasks.length}
      />

      {loading && <div className="board-loading">Загрузка задач…</div>}

      {!loading && tasks.length === 0 && (
        <div className="empty-state">
          <h3 className="empty-state__title">Пока нет ни одной задачи</h3>
          <p className="empty-state__text">
            Создайте первую карточку — она появится в колонке To&nbsp;Do. Горячая клавиша:{' '}
            <kbd>Ctrl+N</kbd>
          </p>
          <button type="button" className="btn btn--primary btn--lg" onClick={() => openForm('create')}>
            <IconPlus size={16} />
            Новая задача
          </button>
        </div>
      )}

      {!loading && nothingFound && (
        <div className="empty-state">
          <h3 className="empty-state__title">Ничего не найдено</h3>
          <p className="empty-state__text">Под выбранные фильтры не подходит ни одна задача.</p>
          <button
            type="button"
            className="btn"
            onClick={() => setFilters({ ...DEFAULT_FILTERS })}
          >
            <IconRotateCcw size={14} />
            Сбросить фильтры
          </button>
        </div>
      )}

      {!loading && !nothingFound && tasks.length > 0 && <KanbanBoard tasks={visibleTasks} />}
    </div>
  );
}
// ============================================================
// [END: Главный экран]
// ============================================================
