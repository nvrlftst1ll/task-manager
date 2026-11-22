// ============================================================
// [START: Кастомный title bar для frameless-окна]
// Вся полоса — drag-область (-webkit-app-region: drag), кнопки
// управления окном — no-drag. В браузерном режиме кнопки
// заблокированы (управление окном доступно только в Electron).
// ============================================================
import { useEffect, useState } from 'react';
import { getTaskApi } from '../lib/api';
import { IconMinus, IconRestore, IconSquare, IconX } from './icons';

export function TitleBar() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    // В браузерном фолбэке window-контроллера нет — onStateChange отсутствует
    const unsubscribe = getTaskApi().window?.onStateChange((state) =>
      setMaximized(state.maximized)
    );
    return () => unsubscribe?.();
  }, []);

  const controls = getTaskApi().window;
  const inDesktop = Boolean(controls);

  return (
    <header className="titlebar" onDoubleClick={() => controls?.toggleMaximize()}>
      <div className="titlebar__left">
        <span className="titlebar__logo" aria-hidden="true" />
        <span className="titlebar__title">Task Manager</span>
        {!inDesktop && <span className="titlebar__mode">браузерный режим</span>}
      </div>

      <div className="titlebar__controls">
        <button
          type="button"
          className="titlebar__btn"
          onClick={() => controls?.minimize()}
          disabled={!inDesktop}
          aria-label="Свернуть окно"
          title="Свернуть"
        >
          <IconMinus size={14} />
        </button>
        <button
          type="button"
          className="titlebar__btn"
          onClick={() => controls?.toggleMaximize()}
          disabled={!inDesktop}
          aria-label={maximized ? 'Восстановить окно' : 'Развернуть окно'}
          title={maximized ? 'Восстановить' : 'Развернуть'}
        >
          {maximized ? <IconRestore size={13} /> : <IconSquare size={13} />}
        </button>
        <button
          type="button"
          className="titlebar__btn titlebar__btn--close"
          onClick={() => controls?.close()}
          disabled={!inDesktop}
          aria-label="Закрыть окно"
          title="Закрыть"
        >
          <IconX size={14} />
        </button>
      </div>
    </header>
  );
}
// ============================================================
// [END: Кастомный title bar]
// ============================================================
