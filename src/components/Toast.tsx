// ============================================================
// [START: Стек всплывающих уведомлений (тостов)]
// ============================================================
import { useUiStore } from '../store/uiStore';

export function ToastStack() {
  const toasts = useUiStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
// ============================================================
// [END: Стек всплывающих уведомлений]
// ============================================================
