// ============================================================
// [START: Форматирование дат для UI]
// ============================================================

/**
 * Короткий формат дедлайна для карточки: «12 мар, 14:00».
 * @param iso дата в ISO 8601
 */
export function formatDeadlineShort(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/**
 * Полный формат для экрана деталей: «12 марта 2026 г., 14:00».
 * @param iso дата в ISO 8601
 */
export function formatDeadlineFull(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(iso));
}

/**
 * Преобразует ISO-дату в значение <input type="datetime-local">
 * («ГГГГ-ММ-ДДTЧЧ:ММ») в локальной таймзоне.
 * @param iso дата в ISO 8601 или null
 * @returns строка для input либо '' при отсутствии даты
 */
export function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}
// ============================================================
// [END: Форматирование дат для UI]
// ============================================================
