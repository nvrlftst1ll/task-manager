// ============================================================
// [START: Хук темы оформления]
// Ставит data-theme на <html>: light/dark, а режим system
// отслеживает системную тему через matchMedia.
// ============================================================
import { useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';

export function useTheme(): void {
  const theme = useSettingsStore((s) => s.settings.theme);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      root.dataset.theme = resolved;
    };

    apply();

    // В системном режиме реагируем на смену темы ОС на лету
    if (theme === 'system') {
      media.addEventListener('change', apply);
      return () => media.removeEventListener('change', apply);
    }
  }, [theme]);
}
// ============================================================
// [END: Хук темы оформления]
// ============================================================
