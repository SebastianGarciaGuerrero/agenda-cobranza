/**
 * Timeline.js — Renders the gestión history timeline for a debtor.
 */

import { TIPOS_GESTION } from '../utils/constants.js';
import { formatShort, isOverduePromise } from '../utils/date.js';
import { formatMoney, esc } from '../utils/format.js';

/**
 * Renders the full gestión timeline HTML (newest first).
 * @param {Array} gestiones
 * @returns {string} HTML
 */
export function renderTimeline(gestiones) {
  if (!gestiones || gestiones.length === 0) {
    return `<p class="empty-state" style="text-align:left;padding:1rem 0">
      Sin gestiones registradas.<br>Agregá la primera con el botón de arriba.
    </p>`;
  }

  const items = [...gestiones].reverse().map(g => renderItem(g)).join('');
  return `<div class="timeline">${items}</div>`;
}

function renderItem(g) {
  const tipo    = TIPOS_GESTION[g.tipo] || TIPOS_GESTION.otro;
  const overdue = isOverduePromise(g);

  let extra = '';
  if (g.tipo === 'promesa' && g.pFecha) {
    const overdueLabel = overdue
      ? ` <span style="color:var(--danger);font-size:var(--fs-xs)">(vencida)</span>`
      : '';
    extra = `<div class="timeline-extra">
      Promesa: ${formatMoney(g.pMonto)} para el ${formatShort(g.pFecha)}${overdueLabel}
    </div>`;
  } else if ((g.tipo === 'pago' || g.tipo === 'abono') && g.pago) {
    extra = `<div class="timeline-extra">Monto: ${formatMoney(g.pago)}</div>`;
  }

  return `
    <div class="timeline-item" data-gid="${esc(g.id)}">
      <div class="timeline-dot" style="background:${tipo.dot}"></div>
      <div class="timeline-body">
        <div class="timeline-header">
          <span class="timeline-tipo">${tipo.label}</span>
          <span class="timeline-fecha">${formatShort(g.fecha)}</span>
          <span class="timeline-actions">
            <button class="btn-icon btn-delete-gestion" data-gid="${esc(g.id)}" title="Eliminar gestión">🗑</button>
          </span>
        </div>
        ${extra}
        ${g.nota ? `<div class="timeline-nota selectable">${esc(g.nota)}</div>` : ''}
      </div>
    </div>`;
}
