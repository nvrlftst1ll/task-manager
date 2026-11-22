// ============================================================
// [START: Хук горячих клавиш + мост действий меню]
// Ctrl/Cmd+N — новая задача, Ctrl/Cmd+F — поиск, Ctrl/Cmd+, —
// настройки. Действия приложения-меню (Electron Menu) приходят
// по IPC и обрабатываются здесь же — единая точка маршрутизации.
// ============================================================
import { useEffect } from 'react';
import { useUiStore } from '../store/uiStore';
import { useSettingsStore } from '../store/settingsStore';
import { getTaskApi } from '../lib/api';
import type { MenuAction } from '../types';

/** Обрабатывает действие меню приложения (приходит из main по IPC). */
function handleMenuAction(action: MenuAction): void {
  const ui = useUiStore.getState();
  switch (action) {
    case 'new-task':
      ui.openForm('create');
      break;
    case 'focus-search':
      ui.focusSearch();
      break;
    case 'open-settings':
      ui.openSettings();
      break;
    case 'theme-light':
      void useSettingsStore.getState().update({ theme: 'light' });
      break;
    case 'theme-dark':
      void useSettingsStore.getState().update({ theme: 'dark' });
      break;
  }
}

export function useHotkeys(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey;
      if (!mod) return;

      const key = event.key.toLowerCase();
      if (key === 'n') {
        event.preventDefault(); // перехватываем «новое окно» браузера
        useUiStore.getState().openForm('create');
      } else if (key === 'f') {
        event.preventDefault(); // перехватываем поиск браузера
        useUiStore.getState().focusSearch();
      } else if (event.key === ',') {
        event.preventDefault();
        useUiStore.getState().openSettings();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    // Подписка на действия меню (в браузерном фолбэке menu === undefined)
    const unsubscribe = getTaskApi().menu?.onAction(handleMenuAction);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      unsubscribe?.();
    };
  }, []);
}
// ============================================================
// [END: Хук горячих клавиш]
// ============================================================
