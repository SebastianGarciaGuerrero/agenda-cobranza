/**
 * Badge.js — Status badge HTML generator.
 */

const CONFIG = {
  promesa:   { label: 'Promesa',    cls: 'badge-promesa' },
  pago:      { label: 'Pagó',       cls: 'badge-pago'    },
  abono:     { label: 'Abono',      cls: 'badge-pago'    },
  acuerdo:   { label: 'Acuerdo',    cls: 'badge-acuerdo' },
  caido:     { label: 'Caído',      cls: 'badge-caido'   },
  negativa:  { label: 'Negativa',   cls: 'badge-caido'   },
  llamada_si:{ label: 'Contactado', cls: 'badge-llamada' },
  llamada_no:{ label: 'Sin contacto',cls:'badge-neutral'  },
  whatsapp:  { label: 'WhatsApp',   cls: 'badge-llamada' },
  email:     { label: 'Email',      cls: 'badge-llamada' },
  otro:      { label: 'Gestión',    cls: 'badge-neutral' },
  sin:       { label: 'Sin gestión',cls: 'badge-neutral' },
};

/**
 * Returns the HTML string for a status badge.
 * @param {string} tipo
 * @returns {string}
 */
export function badge(tipo) {
  const { label, cls } = CONFIG[tipo] || CONFIG.sin;
  return `<span class="badge ${cls}">${label}</span>`;
}

/**
 * Returns the last gestión type for a debtor object.
 * @param {object|undefined} deb
 * @returns {string}
 */
export function lastTipo(deb) {
  if (!deb?.gestiones?.length) return 'sin';
  return deb.gestiones[deb.gestiones.length - 1].tipo;
}
