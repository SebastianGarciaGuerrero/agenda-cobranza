/**
 * format.js — Formatting, IDs, escaping, CSV export.
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

/**
 * Converts the debtors object to a CSV string.
 * BOM (\uFEFF) should be prepended when writing to disk for Excel compatibility.
 */
export function toCSV(debtors) {
  const headers = [
    'ID', 'Nombre', 'RUT',
    'Deuda Total', 'Saldo Pendiente', 'Estado',
    'Última Gestión', 'Fecha Última Gestión', 'Nota Última Gestión',
  ];

  const rows = Object.values(debtors).map(d => {
    const gestiones = d.gestiones || [];
    const last = gestiones.length ? gestiones[gestiones.length - 1] : null;
    return [
      d.id       || '',
      d.nombre   || '',
      d.rut      || '',
      d.deudaTotal != null ? d.deudaTotal : '',
      d.saldo     != null ? d.saldo     : '',
      d.estado   || '',
      last ? last.tipo  : '',
      last ? last.fecha : '',
      last ? (last.nota || '') : '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}
