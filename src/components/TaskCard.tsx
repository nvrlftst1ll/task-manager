// ============================================================
// [START: Карточка задачи]
// TaskCardView — чистая презентация (используется и в DragOverlay);
// TaskCard — draggable-обёртка. Клик/Enter открывают детали,
// Space запускает перетаскивание с клавиатуры (dnd-kit).
// ============================================================
import { useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { PRIORITY_LABELS, type Task } from '../types';
import { formatDeadlineShort } from '../lib/format';
import { useUiStore } from '../store/uiStore';
import { IconCalendar } from './icons';

/** Презентационная часть карточки (без drag-логики). */
export function TaskCardView({ task, overlay = false }: { task: Task; overlay?: boolean }) {
  const deadlineTs = task.deadline ? Date.parse(task.deadline) : null;
  const overdue = deadlineTs !== null && deadlineTs < Date.now() && task.status !== 'done';

  return (
    <article className={`task-card task-card--${task.priority}${overlay ? ' task-card--overlay' : ''}`}>
      <div className="task-card__top">
        <span className={`chip chip--prio-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
        {overdue && <span className="task-card__overdue">Просрочено</span>}
        {task.status === 'done' && <span className="task-card__done">Выполнено</span>}
      </div>

      <h4 className="task-card__title">{task.title}</h4>

      {task.description && <p className="task-card__desc">{task.description}</p>}

      {(task.deadline || task.tags.length > 0) && (
        <div className="task-card__meta">
          {task.deadline && (
            <span className={`task-card__deadline${overdue ? ' task-card__deadline--late' : ''}`}>
              <IconCalendar size={13} />
              {formatDeadlineShort(task.deadline)}
            </span>
          )}
          {task.tags.map((tag) => (
            <span key={tag} className="task-card__tag">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

/** Draggable-карточка колонки. */
export function TaskCard({ task }: { task: Task }) {
  const openDetail = useUiStore((s) => s.openDetail);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  // transform у LiveAnnouncer-ов dnd-kit приходит готовым к CSS
  const style = useMemo(
    () => ({ transform: CSS.Translate.toString(transform) }),
    [transform]
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'task-card-wrap task-card-wrap--dragging' : 'task-card-wrap'}
      {...attributes}
      {...listeners}
      onClick={() => openDetail(task.id)}
      onKeyDown={(event) => {
        // Space отдан dnd-kit (старт drag с клавиатуры), Enter — детали
        if (event.key === 'Enter') {
          event.preventDefault();
          openDetail(task.id);
        }
      }}
    >
      <TaskCardView task={task} />
    </div>
  );
}
// ============================================================
// [END: Карточка задачи]
// ============================================================
