// ============================================================
// [START: Модал деталей задачи]
// Просмотр всех полей + быстрые действия: смена статуса
// (сегмент-кнопки), редактирование (переход в форму), удаление
// (диалог подтверждения).
// ============================================================
import {
  PRIORITY_LABELS,
  STATUSES,
  STATUS_LABELS,
  type TaskStatus,
} from '../types';
import { formatDeadlineFull } from '../lib/format';
import { useTasksStore } from '../store/tasksStore';
import { useUiStore } from '../store/uiStore';
import { Modal } from './Modal';
import { IconPencil, IconTrash } from './icons';

export function TaskDetailModal() {
  const detailTaskId = useUiStore((s) => s.detailTaskId);
  const closeDetail = useUiStore((s) => s.closeDetail);
  const openForm = useUiStore((s) => s.openForm);
  const askDelete = useUiStore((s) => s.askDelete);
  const moveTask = useTasksStore((s) => s.moveTask);
  const task = useTasksStore((s) => s.tasks.find((t) => t.id === detailTaskId) ?? null);

  return (
    <Modal open={Boolean(task)} title="Детали задачи" onClose={closeDetail}>
      {task && (
        <div className="detail">
          <h4 className="detail__title">{task.title}</h4>

          <div className="field">
            <span className="field__label">Статус</span>
            <div className="segmented" role="radiogroup" aria-label="Статус задачи">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  role="radio"
                  aria-checked={task.status === status}
                  className={`segmented__btn${
                    task.status === status ? ' segmented__btn--active' : ''
                  }`}
                  onClick={() => void moveTask(task.id, status as TaskStatus)}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>

          <dl className="detail__rows">
            <div className="detail__row">
              <dt>Приоритет</dt>
              <dd>
                <span className={`chip chip--prio-${task.priority}`}>
                  {PRIORITY_LABELS[task.priority]}
                </span>
              </dd>
            </div>
            <div className="detail__row">
              <dt>Дедлайн</dt>
              <dd>{task.deadline ? formatDeadlineFull(task.deadline) : 'не задан'}</dd>
            </div>
            <div className="detail__row">
              <dt>Теги</dt>
              <dd>
                {task.tags.length > 0
                  ? task.tags.map((tag) => (
                      <span key={tag} className="task-card__tag">
                        #{tag}
                      </span>
                    ))
                  : 'нет'}
              </dd>
            </div>
            <div className="detail__row">
              <dt>Создана</dt>
              <dd>{formatDeadlineFull(task.createdAt)}</dd>
            </div>
            <div className="detail__row">
              <dt>Обновлена</dt>
              <dd>{formatDeadlineFull(task.updatedAt)}</dd>
            </div>
          </dl>

          {task.description && <p className="detail__desc">{task.description}</p>}

          <footer className="modal__foot">
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => askDelete(task.id)}
            >
              <IconTrash size={14} />
              Удалить
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => openForm('edit', task.id)}
            >
              <IconPencil size={14} />
              Редактировать
            </button>
          </footer>
        </div>
      )}
    </Modal>
  );
}
// ============================================================
// [END: Модал деталей задачи]
// ============================================================
