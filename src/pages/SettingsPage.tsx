// ============================================================
// [START: Экран настроек]
// Тема, уведомления дедлайнов, горячие клавиши и экспорт данных.
// Все изменения применяются сразу и сохраняются в SQLite.
// ============================================================
import { STATUSES, STATUS_LABELS, THEME_LABELS, DEADLINE_THRESHOLDS, type ThemeMode } from '../types';
import { useSettingsStore } from '../store/settingsStore';
import { useTasksStore } from '../store/tasksStore';
import { useUiStore } from '../store/uiStore';
import { IconArrowLeft, IconBell, IconDatabase, IconDownload, IconKeyboard, IconMoon, IconMonitor, IconSun } from '../components/icons';

const HOTKEYS: ReadonlyArray<[string, string]> = [
  ['Ctrl+N', 'Новая задача'],
  ['Ctrl+F', 'Поиск задач'],
  ['Ctrl+,', 'Открыть настройки'],
  ['Ctrl+Q / Alt+F4', 'Выход из приложения'],
  ['Space', 'Начать перетаскивание карточки (фокус на карточке)'],
  ['Стрелки', 'Перемещение карточки при клавиатурном drag'],
  ['Enter', 'Открыть детали задачи (фокус на карточке)'],
  ['Esc', 'Закрыть окно/форму'],
];

export function SettingsPage() {
  const { settings, update } = useSettingsStore();
  const tasks = useTasksStore((s) => s.tasks);
  const closeSettings = useUiStore((s) => s.closeSettings);
  const showToast = useUiStore((s) => s.showToast);

  /** Выгружает все задачи в JSON-файл. */
  const exportJson = () => {
    try {
      const payload = { exportedAt: new Date().toISOString(), tasks };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'task-manager-tasks.json';
      anchor.click();
      URL.revokeObjectURL(url);
      showToast('Экспорт готов: task-manager-tasks.json');
    } catch (error) {
      console.error('[settings] ошибка экспорта:', error);
      showToast('Не удалось выполнить экспорт', 'error');
    }
  };

  const themeIcons: Record<ThemeMode, JSX.Element> = {
    light: <IconSun size={18} />,
    dark: <IconMoon size={18} />,
    system: <IconMonitor size={18} />,
  };

  return (
    <div className="settings">
      <header className="settings__head">
        <button type="button" className="btn btn--ghost" onClick={closeSettings}>
          <IconArrowLeft size={15} />
          Назад к доске
        </button>
        <h2 className="settings__title">Настройки</h2>
      </header>

      <section className="settings__section">
        <h3 className="settings__section-title">
          <IconSun size={15} />
          Тема оформления
        </h3>
        <div className="segmented" role="radiogroup" aria-label="Тема оформления">
          {(Object.keys(THEME_LABELS) as ThemeMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={settings.theme === mode}
              className={`segmented__btn${settings.theme === mode ? ' segmented__btn--active' : ''}`}
              onClick={() => void update({ theme: mode })}
            >
              {themeIcons[mode]}
              {THEME_LABELS[mode]}
            </button>
          ))}
        </div>
      </section>

      <section className="settings__section">
        <h3 className="settings__section-title">
          <IconBell size={15} />
          Уведомления о дедлайнах
        </h3>
        <label className="settings__row">
          <span>Системные уведомления</span>
          <input
            type="checkbox"
            className="switch"
            checked={settings.notificationsEnabled}
            onChange={(e) => void update({ notificationsEnabled: e.target.checked })}
            role="switch"
            aria-label="Системные уведомления о дедлайнах"
          />
        </label>
        <label className="settings__row">
          <span>Напоминать заранее за</span>
          <select
            className="select"
            value={settings.deadlineThresholdHours}
            onChange={(e) =>
              void update({
                deadlineThresholdHours: Number(e.target.value) as 1 | 6 | 12 | 24,
              })
            }
            aria-label="Порог напоминания о дедлайне"
          >
            {DEADLINE_THRESHOLDS.map((hours) => (
              <option key={hours} value={hours}>
                {hours} ч
              </option>
            ))}
          </select>
        </label>
        <p className="settings__hint">
          Наблюдатель в main-процессе проверяет дедлайны каждую минуту; уведомление приходит
          один раз на задачу, даже если приложение свёрнуто.
        </p>
      </section>

      <section className="settings__section">
        <h3 className="settings__section-title">
          <IconKeyboard size={15} />
          Горячие клавиши
        </h3>
        <table className="kv-table">
          <tbody>
            {HOTKEYS.map(([keys, description]) => (
              <tr key={keys}>
                <td>
                  <kbd>{keys}</kbd>
                </td>
                <td>{description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="settings__section">
        <h3 className="settings__section-title">
          <IconDatabase size={15} />
          Данные
        </h3>
        <p className="settings__hint">
          Всего задач: <b>{tasks.length}</b>
          {STATUSES.map((status) => (
            <span key={status}>
              {' · '}
              {STATUS_LABELS[status]}: <b>{tasks.filter((t) => t.status === status).length}</b>
            </span>
          ))}
          . Хранилище — SQLite (better-sqlite3) в main-процессе.
        </p>
        <button type="button" className="btn" onClick={exportJson}>
          <IconDownload size={15} />
          Экспортировать задачи в JSON
        </button>
      </section>
    </div>
  );
}
// ============================================================
// [END: Экран настроек]
// ============================================================
