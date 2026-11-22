// ============================================================
// [START: Колонка канбан-доски]
// Droppable-зона статуса: карточки можно бросить в любую колонку,
// при наведении колонка подсвечивается.
// ============================================================
import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { STATUS_LABELS, type Task, type TaskStatus } from '../types';
import { sortTasks } from '../lib/filters';
import { TaskCard } from './TaskCard';

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
}

export function TaskColumn({ status, tasks }: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const sorted = useMemo(() => sortTasks(tasks), [tasks]);

  return (
    <section
      ref={setNodeRef}
      className={`board-col board-col--${status}${isOver ? ' board-col--over' : ''}`}
      aria-label={`Колонка ${STATUS_LABELS[status]}`}
    >
      <header className="board-col__head">
        <span className={`board-col__dot board-col__dot--${status}`} aria-hidden="true" />
        <h2 className="board-col__title">{STATUS_LABELS[status]}</h2>
        <span className="board-col__count">{sorted.length}</span>
      </header>

      <div className="board-col__list">
        {sorted.length === 0 ? (
          <p className="board-col__empty">Пусто — перетащите задачи сюда</p>
        ) : (
          sorted.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </section>
  );
}
// ============================================================
// [END: Колонка канбан-доски]
// ============================================================
