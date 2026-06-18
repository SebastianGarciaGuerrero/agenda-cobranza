/**
 * format.js — Formatting, IDs, escaping, Excel export rows.
 */

/** Chilean peso formatting */
export function formatMoney(amount) {
  if (amount == null || amount === '') return '—';
  return '$' + Number(amount).toLocaleString('es-CL');
}

/** Unique ID generator */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * Escapes HTML special characters to prevent XSS when using innerHTML.
 * Always use this for any user-supplied text rendered into HTML.
 */
export function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** YYYY-MM-DD → DD/MM/YYYY (para la columna Fecha del Excel) */
function fechaDMY(str) {
  const [y, m, d] = String(str).split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Arma la tabla de exportación a Excel a partir de la agenda.
 * Una fila por cada (día, deudor agendado), ordenada por fecha y luego por ID.
 * Columnas: Fecha · ID · Nombre · Comentario del día.
 *
 * @param {{agenda: object, debtors: object, notas: object}} data
 * @returns {{headers: string[], rows: string[][], sheetName: string}}
 */
export function buildAgendaExport(data) {
  const { agenda = {}, debtors = {}, notas = {} } = data;

  const rows = [];
  for (const day of Object.keys(agenda)) {
    for (const id of agenda[day] || []) {
      const deb  = debtors[id] || {};
      const nota = notas[day]?.[id] || '';
      rows.push({ day, id, nombre: deb.nombre || '', nota });
    }
  }

  // Orden: por fecha ascendente, y dentro de cada fecha por ID
  rows.sort((a, b) => {
    if (a.day !== b.day) return a.day < b.day ? -1 : 1;
    return String(a.id).localeCompare(String(b.id), 'es', { numeric: true });
  });

  return {
    headers: ['Fecha', 'ID', 'Nombre', 'Comentario del día'],
    rows: rows.map(r => [fechaDMY(r.day), r.id, r.nombre, r.nota]),
    sheetName: 'Agenda',
  };
}
