// ============================================================
// [START: Модальная форма задачи (создание и редактирование)]
// Валидация — чистая функция validateTaskForm: ошибки показываются
// у полей; ошибка от main-процесса (IPC) — общей строкой формы.
// Внутренний компонент монтируется только при открытии, поэтому
// локальное состояние формы инициализируется без эффектов.
// ============================================================
import { useState, type FormEvent } from 'react';
import { PRIORITIES, PRIORITY_LABELS, type Task } from '../types';
import {
  MAX_TAGS_COUNT,
  toTaskInput,
  validateTaskForm,
  type FormErrors,
  type TaskFormValues,
} from '../lib/validation';
import { isoToLocalInput } from '../lib/format';
import { useTasksStore } from '../store/tasksStore';
import { useUiStore } from '../store/uiStore';
import { Modal } from './Modal';
import { IconPlus, IconX } from './icons';

function emptyValues(): TaskFormValues {
  return { title: '', description: '', deadline: '', priority: 'medium', tags: [] };
}

function valuesFromTask(task: Task): TaskFormValues {
  return {
    title: task.title,
    description: task.description,
    deadline: isoToLocalInput(task.deadline),
    priority: task.priority,
    tags: [...task.tags],
  };
}

interface TaskFormProps {
  mode: 'create' | 'edit';
  task: Task | null;
}

/** Содержимое формы: живёт только пока открыто окно. */
function TaskForm({ mode, task }: TaskFormProps) {
  const closeForm = useUiStore((s) => s.closeForm);
  const showToast = useUiStore((s) => s.showToast);
  const createTask = useTasksStore((s) => s.createTask);
  const updateTask = useTasksStore((s) => s.updateTask);

  const [values, setValues] = useState<TaskFormValues>(() =>
    task ? valuesFromTask(task) : emptyValues()
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const setField = (patch: Partial<TaskFormValues>) =>
    setValues((prev) => ({ ...prev, ...patch }));

  /** Добавляет тег из поля ввода (Enter, запятая или кнопка). */
  const addTag = () => {
    const tag = tagInput.split(',')[0].trim();
    if (tag === '') return;
    if (values.tags.length >= MAX_TAGS_COUNT) {
      setErrors((e) => ({ ...e, tags: `Не больше ${MAX_TAGS_COUNT} тегов` }));
      return;
    }
    if (!values.tags.includes(tag)) {
      setField({ tags: [...values.tags, tag] });
    }
    setTagInput('');
    setErrors((e) => ({ ...e, tags: undefined }));
  };

  const removeTag = (tag: string) => setField({ tags: values.tags.filter((t) => t !== tag) });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const fieldErrors = validateTaskForm(values);
    setErrors(fieldErrors);
    if (Object.values(fieldErrors).some(Boolean)) return;

    setSaving(true);
    try {
      // При редактировании статус не трогаем (меняется отдельно на доске/в деталях)
      const input = toTaskInput(values, mode === 'edit' && task ? task.status : 'todo');
      if (mode === 'create') {
        await createTask(input);
        showToast('Задача создана');
      } else if (task) {
        await updateTask(task.id, input);
        showToast('Изменения сохранены');
      }
      closeForm();
    } catch (error) {
      // Ошибка серверной валидации (IPC) или записи в БД — в общую строку формы
      setErrors({ form: error instanceof Error ? error.message : 'Не удалось сохранить задачу' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form" onSubmit={(e) => void handleSubmit(e)} noValidate>
      <label className="field">
        <span className="field__label">Название *</span>
        <input
          className={`input${errors.title ? ' input--error' : ''}`}
          value={values.title}
          onChange={(e) => setField({ title: e.target.value })}
          placeholder="Что нужно сделать?"
          autoFocus
          aria-invalid={Boolean(errors.title)}
        />
        {errors.title && <span className="field__error">{errors.title}</span>}
      </label>

      <label className="field">
        <span className="field__label">Описание</span>
        <textarea
          className="input input--area"
          value={values.description}
          onChange={(e) => setField({ description: e.target.value })}
          placeholder="Детали, ссылки, критерии готовности…"
          rows={3}
        />
      </label>

      <div className="form__row">
        <label className="field">
          <span className="field__label">Дедлайн</span>
          <input
            type="datetime-local"
            className={`input${errors.deadline ? ' input--error' : ''}`}
            value={values.deadline}
            onChange={(e) => setField({ deadline: e.target.value })}
            aria-invalid={Boolean(errors.deadline)}
          />
          {errors.deadline && <span className="field__error">{errors.deadline}</span>}
        </label>

        <div className="field">
          <span className="field__label">Приоритет</span>
          <div className="segmented" role="radiogroup" aria-label="Приоритет">
            {PRIORITIES.map((priority) => (
              <button
                key={priority}
                type="button"
                role="radio"
                aria-checked={values.priority === priority}
                className={`segmented__btn segmented__btn--${priority}${
                  values.priority === priority ? ' segmented__btn--active' : ''
                }`}
                onClick={() => setField({ priority })}
              >
                {PRIORITY_LABELS[priority]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="field">
        <span className="field__label">
          Теги ({values.tags.length}/{MAX_TAGS_COUNT})
        </span>
        <div className="tags-editor">
          {values.tags.map((tag) => (
            <span key={tag} className="tag-chip">
              #{tag}
              <button
                type="button"
                className="tag-chip__x"
                onClick={() => removeTag(tag)}
                aria-label={`Удалить тег ${tag}`}
              >
                <IconX size={11} />
              </button>
            </span>
          ))}
          <div className="tags-editor__input">
            <input
              className="input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Добавить тег…"
              aria-label="Новый тег"
            />
            <button type="button" className="icon-btn" onClick={addTag} aria-label="Добавить тег">
              <IconPlus size={14} />
            </button>
          </div>
        </div>
        {errors.tags && <span className="field__error">{errors.tags}</span>}
      </div>

      {errors.form && (
        <div className="form__error" role="alert">
          {errors.form}
        </div>
      )}

      <footer className="modal__foot">
        <button type="button" className="btn" onClick={closeForm}>
          Отмена
        </button>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Сохранение…' : mode === 'create' ? 'Создать задачу' : 'Сохранить'}
        </button>
      </footer>
    </form>
  );
}

/** Обёртка: следит за состоянием ui-стора и монтирует форму. */
export function TaskFormModal() {
  const open = useUiStore((s) => s.formOpen);
  const mode = useUiStore((s) => s.formMode);
  const formTaskId = useUiStore((s) => s.formTaskId);
  const closeForm = useUiStore((s) => s.closeForm);
  const task = useTasksStore((s) => s.tasks.find((t) => t.id === formTaskId) ?? null);

  const title = mode === 'create' ? 'Новая задача' : 'Редактирование задачи';

  return (
    <Modal open={open} title={title} onClose={closeForm}>
      {open && <TaskForm key={formTaskId ?? 'create'} mode={mode} task={task} />}
    </Modal>
  );
}
// ============================================================
// [END: Модальная форма задачи]
// ============================================================
