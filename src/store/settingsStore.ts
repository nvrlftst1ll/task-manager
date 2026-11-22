// ============================================================
// [START: Стор настроек (Zustand) — тема, уведомления, онбординг]
// Записи оптимистичны с откатом; main-процесс кладёт значения
// в SQLite, поэтому настройки переживают перезапуск.
// ============================================================
import { create } from 'zustand';
import { DEFAULT_SETTINGS, type Settings } from '../types';
import { getTaskApi } from '../lib/api';
import { useUiStore } from './uiStore';

interface SettingsState {
  settings: Settings;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  load: async () => {
    try {
      const settings = await getTaskApi().settings.getAll();
      set({ settings, loaded: true });
    } catch (error) {
      console.error('[settings] ошибка загрузки:', error);
      // Работаем на дефолтах, приложение остаётся пригодным к использованию
      set({ loaded: true });
      useUiStore.getState().showToast('Не удалось загрузить настройки', 'error');
    }
  },

  update: async (patch) => {
    const previous = get().settings;
    set({ settings: { ...previous, ...patch } }); // оптимистично
    try {
      const settings = await getTaskApi().settings.set(patch);
      set({ settings });
    } catch (error) {
      console.error('[settings] ошибка сохранения:', error);
      set({ settings: previous }); // откат
      useUiStore.getState().showToast('Не удалось сохранить настройки', 'error');
    }
  },
}));
// ============================================================
// [END: Стор настроек]
// ============================================================
