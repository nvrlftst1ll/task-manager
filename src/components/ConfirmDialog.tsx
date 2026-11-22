// ============================================================
// [START: Диалог подтверждения удаления]
// ============================================================
import { useState } from 'react';
import { useTasksStore } from '../store/tasksStore';
import { useUiStore } from '../store/uiStore';
import { Modal } from './Modal';

export function ConfirmDialog() {
  const confirmDeleteId = useUiStore((s) => s.confirmDeleteId);
  const cancelDelete = useUiStore((s) => s.cancelDelete);
  const showToast = useUiStore((s) => s.showToast);
  const deleteTask = useTasksStore((s) => s.deleteTask);
  const task = useTasksStore((s) => s.tasks.find((t) => t.id === confirmDeleteId) ?? null);
  const [deleting, setDeleting] = useState(false);

  const confirm = async () => {
    if (!task) return;
    setDeleting(true);
    try {
      await deleteTask(task.id);
      showToast('Задача удалена');
    } catch (error) {
      console.error('[delete] ошибка удаления:', error);
      showToast('Не удалось удалить задачу', 'error');
    } finally {
      setDeleting(false);
      cancelDelete();
    }
  };

  return (
    <Modal open={Boolean(task)} title="Удалить задачу?" onClose={cancelDelete} width={440}>
      {task && (
        <div>
          <p className="confirm__text">
            Задача <b>«{task.title}»</b> будет удалена безвозвратно вместе со всеми данными.
          </p>
          <footer className="modal__foot">
            <button type="button" className="btn" onClick={cancelDelete}>
              Отмена
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => void confirm()}
              disabled={deleting}
            >
              {deleting ? 'Удаление…' : 'Удалить'}
            </button>
          </footer>
        </div>
      )}
    </Modal>
  );
}
// ============================================================
// [END: Диалог подтверждения удаления]
// ============================================================
