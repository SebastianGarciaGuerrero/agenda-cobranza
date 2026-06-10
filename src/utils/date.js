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

/** YYYY-MM-DD + n days → YYYY-MM-DD */
export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return toDateStr(new Date(y, m - 1, d + n));
}

/** Rounds a date forward to the next business day (Sat→Mon, Sun→Mon) */
export function toBusinessDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  if (dow === 6) return addDays(dateStr, 2); // sábado → lunes
  if (dow === 0) return addDays(dateStr, 1); // domingo → lunes
  return dateStr;
}

/** YYYY-MM-DD + n months → YYYY-MM-DD (clamps al último día del mes: 31/01 + 1 mes = 28/02) */
export function addMonths(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const lastDay = new Date(y, m - 1 + n + 1, 0).getDate();
  return toDateStr(new Date(y, m - 1 + n, Math.min(d, lastDay)));
}

/** Adds n business days (Mon–Fri) to a date */
export function addBusinessDays(dateStr, n) {
  let result = dateStr;
  for (let i = 0; i < n; i++) {
    result = toBusinessDay(addDays(result, 1));
  }
  return result;
}

/** Returns true if a gestión is an overdue unfulfilled promise */
export function isOverduePromise(gestion) {
  return gestion.tipo === 'promesa' && gestion.pFecha && isPast(gestion.pFecha);
}
