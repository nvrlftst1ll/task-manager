// ============================================================
// [START: Базовое модальное окно]
// Портал в body + оверлей; закрытие по Esc и клику по фону
// (отключается параметром dismissible — для онбординга).
// ============================================================
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconX } from './icons';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Максимальная ширина окна в px. */
  width?: number;
  /** Можно ли закрыть (Esc/клик по фону/крестик). По умолчанию true. */
  dismissible?: boolean;
}

export function Modal({
  open,
  title,
  onClose,
  children,
  width = 560,
  dismissible = true,
}: ModalProps) {
  // Esc закрывает окно; слушатель вешается только пока окно открыто
  useEffect(() => {
    if (!open || !dismissible) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, dismissible, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="overlay"
      onMouseDown={(event) => {
        // Закрытие только по клику именно по фону, не по содержимому
        if (dismissible && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ maxWidth: width }}
      >
        <header className="modal__head">
          <h3 className="modal__title">{title}</h3>
          {dismissible && (
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть окно">
              <IconX size={16} />
            </button>
          )}
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
// ============================================================
// [END: Базовое модальное окно]
// ============================================================
