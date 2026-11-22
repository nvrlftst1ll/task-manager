// ============================================================
// [START: Онбординг — приветствие при первом запуске]
// Показывается, пока в настройках onboarded === false (флаг
// хранится в SQLite, поэтому онбординг бывает ровно один раз).
// ============================================================
import { useEffect, useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useUiStore } from '../store/uiStore';
import { Modal } from './Modal';
import { IconCheck, IconMonitor, IconMoon, IconSun } from './icons';
import type { ThemeMode } from '../types';

const HOTKEYS: ReadonlyArray<[string, string]> = [
  ['Ctrl+N', 'новая задача'],
  ['Ctrl+F', 'поиск задач'],
  ['Ctrl+,', 'настройки'],
  ['Space / стрелки', 'перетаскивание карточки с клавиатуры'],
];

export function OnboardingModal() {
  const { settings, loaded, update } = useSettingsStore();
  const showToast = useUiStore((s) => s.showToast);
  const open = loaded && !settings.onboarded;
  const [theme, setTheme] = useState<ThemeMode>(settings.theme);

  // Если настройки догружаются после монтирования — подтягиваем тему
  useEffect(() => {
    if (open) setTheme(settings.theme);
  }, [open, settings.theme]);

  const finish = async () => {
    await update({ onboarded: true, theme });
    showToast('Добро пожаловать в Task Manager');
  };

  const themeOptions: ReadonlyArray<{ mode: ThemeMode; label: string; icon: JSX.Element }> = [
    { mode: 'light', label: 'Светлая', icon: <IconSun size={20} /> },
    { mode: 'dark', label: 'Тёмная', icon: <IconMoon size={20} /> },
    { mode: 'system', label: 'Как в системе', icon: <IconMonitor size={20} /> },
  ];

  return (
    <Modal open={open} title="Добро пожаловать в Task Manager" onClose={() => undefined} dismissible={false}>
      <div className="onboarding">
        <p className="onboarding__text">
          Канбан-доска для задач: создавайте карточки, перетаскивайте их между колонками
          To&nbsp;Do, In&nbsp;Progress и Done, следите за дедлайнами — приложение напомнит
          о приближающихся системным уведомлением.
        </p>

        <div className="onboarding__section">
          <span className="field__label">Выберите тему оформления</span>
          <div className="theme-cards">
            {themeOptions.map((option) => (
              <button
                key={option.mode}
                type="button"
                className={`theme-card${theme === option.mode ? ' theme-card--active' : ''}`}
                onClick={() => setTheme(option.mode)}
                aria-pressed={theme === option.mode}
              >
                {option.icon}
                <span>{option.label}</span>
                {theme === option.mode && <IconCheck size={14} className="theme-card__check" />}
              </button>
            ))}
          </div>
        </div>

        <div className="onboarding__section">
          <span className="field__label">Горячие клавиши</span>
          <ul className="onboarding__hotkeys">
            {HOTKEYS.map(([keys, description]) => (
              <li key={keys}>
                <kbd>{keys}</kbd>
                <span>{description}</span>
              </li>
            ))}
          </ul>
        </div>

        <footer className="modal__foot">
          <button type="button" className="btn btn--primary" onClick={() => void finish()}>
            Начать работу
          </button>
        </footer>
      </div>
    </Modal>
  );
}
// ============================================================
// [END: Онбординг]
// ============================================================
