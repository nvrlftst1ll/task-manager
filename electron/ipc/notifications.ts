// ============================================================
// [START: Наблюдатель дедлайнов → системные уведомления]
// Каждую минуту проверяет незакрытые задачи с дедлайном.
// Уведомление приходит один раз на задачу; при изменении задачи
// (create/update/delete) память сбрасывается через forget().
// ============================================================
import { Notification, type BrowserWindow } from 'electron';
import type { Settings, Task } from '../../src/types';
import type { TaskRepository } from './repositories';

/** Публичный интерфейс наблюдателя. */
export interface DeadlineWatcher {
  start(): void;
  stop(): void;
  /** Сбрасывает память уведомлений по задаче (после её изменения). */
  forget(taskId: string): void;
}

/** Параметры создания наблюдателя (все зависимости — снаружи). */
export interface DeadlineWatcherOptions {
  repository: Pick<TaskRepository, 'findWithDeadlines'>;
  getSettings: () => Settings;
  getWindow: () => BrowserWindow | null;
  /** Интервал проверки (по умолчанию 60 секунд). */
  intervalMs?: number;
}

/**
 * Форматирует дедлайн для тела уведомления.
 * @param iso дата в ISO 8601
 */
function formatDeadline(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/**
 * Создаёт наблюдателя дедлайнов.
 * @param options зависимости: репозиторий, чтение настроек, окно
 */
export function createDeadlineWatcher(options: DeadlineWatcherOptions): DeadlineWatcher {
  const intervalMs = options.intervalMs ?? 60_000;
  const notifiedTaskIds = new Set<string>();
  let timer: ReturnType<typeof setInterval> | null = null;

  /** Показывает системное уведомление Electron. */
  function notify(task: Task, isOverdue: boolean): void {
    if (!Notification.isSupported()) return;
    const notification = new Notification({
      title: isOverdue ? 'Просрочен дедлайн' : 'Приближается дедлайн',
      body: `${task.title} — ${formatDeadline(task.deadline as string)}`,
      urgency: 'normal',
    });
    // Клик по уведомлению возвращает пользователя к приложению
    notification.on('click', () => {
      const win = options.getWindow();
      if (win) {
        win.show();
        win.focus();
      }
    });
    notification.show();
  }

  /** Один проход проверки. Любая ошибка логируется, но не роняет таймер. */
  function tick(): void {
    try {
      const settings = options.getSettings();
      if (!settings.notificationsEnabled) return;

      const now = Date.now();
      for (const task of options.repository.findWithDeadlines()) {
        if (notifiedTaskIds.has(task.id) || !task.deadline) continue;
        const deadlineTs = Date.parse(task.deadline);
        if (Number.isNaN(deadlineTs)) continue;

        const isOverdue = deadlineTs < now;
        const hoursLeft = (deadlineTs - now) / 3_600_000;
        if (!isOverdue && hoursLeft > settings.deadlineThresholdHours) continue;

        notify(task, isOverdue);
        notifiedTaskIds.add(task.id);
      }
    } catch (error) {
      console.error('[deadline-watcher] ошибка проверки дедлайнов:', error);
    }
  }

  return {
    start() {
      // первый проход сразу, не дожидаясь интервала
      tick();
      timer = setInterval(tick, intervalMs);
    },
    stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    },
    forget(taskId: string) {
      notifiedTaskIds.delete(taskId);
    },
  };
}
// ============================================================
// [END: Наблюдатель дедлайнов → системные уведомления]
// ============================================================
