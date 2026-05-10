/**
 * date.js — Date utilities. All dates are stored as 'YYYY-MM-DD' strings.
 */

/** Returns today as YYYY-MM-DD */
export function today() {
  return toDateStr(new Date());
}

/** Date object → YYYY-MM-DD */
export function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** YYYY-MM-DD → DD/MM/YYYY */
export function formatShort(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

/** YYYY-MM-DD → "5 de mayo, 2026" */
export function formatLong(str) {
  if (!str) return '';
  const months = [
    'enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre',
  ];
  const [y, m, d] = str.split('-');
  return `${parseInt(d, 10)} de ${months[parseInt(m, 10) - 1]}, ${y}`;
}

/** Returns number of days in a month */
export function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/** Returns the day-of-week index (0=Sun) for the 1st of a month */
export function firstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

/** Builds YYYY-MM-DD key for a given year/month/day */
export function buildKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Returns true if the date string is in the past (before today) */
export function isPast(dateStr) {
  return !!dateStr && dateStr < today();
}

/** Returns true if a gestión is an overdue unfulfilled promise */
export function isOverduePromise(gestion) {
  return gestion.tipo === 'promesa' && gestion.pFecha && isPast(gestion.pFecha);
}
