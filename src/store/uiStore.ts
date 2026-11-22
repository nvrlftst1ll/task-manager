// ============================================================
// [START: UI-стор (Zustand) — модальные окна, тосты, фокус поиска]
// Единственный источник «экранного» состояния: какие оверлеи
// открыты, какая задача редактируется, очередь всплывающих
// уведомлений. Горячие клавиши и меню пишут сюда.
// ============================================================
import { create } from 'zustand';

/** Всплывающее уведомление приложения (не системное). */
export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface UiState {
  /** Модальная форма задачи (создание/редактирование). */
  formOpen: boolean;
  formMode: 'create' | 'edit';
  formTaskId: string | null;
  /** Модал деталей задачи. */
  detailTaskId: string | null;
  /** Экран настроек (полноэкранный режим вместо доски). */
  settingsOpen: boolean;
  /** Диалог подтверждения удаления. */
  confirmDeleteId: string | null;
  /** Счётчик импульсов: инкремент = сфокусировать поле поиска. */
  searchFocusSignal: number;
  toasts: Toast[];

  openForm: (mode: 'create' | 'edit', taskId?: string | null) => void;
  closeForm: () => void;
  openDetail: (taskId: string) => void;
  closeDetail: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  askDelete: (taskId: string) => void;
  cancelDelete: () => void;
  focusSearch: () => void;
  showToast: (message: string, type?: Toast['type']) => void;
  dismissToast: (id: number) => void;
}

let toastSeq = 0;

export const useUiStore = create<UiState>()((set, get) => ({
  formOpen: false,
  formMode: 'create',
  formTaskId: null,
  detailTaskId: null,
  settingsOpen: false,
  confirmDeleteId: null,
  searchFocusSignal: 0,
  toasts: [],

  openForm: (mode, taskId = null) =>
    set({ formOpen: true, formMode: mode, formTaskId: mode === 'edit' ? taskId : null, detailTaskId: null }),
  closeForm: () => set({ formOpen: false, formTaskId: null }),

  openDetail: (taskId) => set({ detailTaskId: taskId }),
  closeDetail: () => set({ detailTaskId: null }),

  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),

  askDelete: (taskId) => set({ confirmDeleteId: taskId, detailTaskId: null }),
  cancelDelete: () => set({ confirmDeleteId: null }),

  focusSearch: () => set((s) => ({ searchFocusSignal: s.searchFocusSignal + 1 })),

  showToast: (message, type = 'success') => {
    const id = ++toastSeq;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    // автоскрытие; таймер не хранится: повторный toast не сбивает чужой
    setTimeout(() => get().dismissToast(id), 2800);
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
// ============================================================
// [END: UI-стор]
// ============================================================
