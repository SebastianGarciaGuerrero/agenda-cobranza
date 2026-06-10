/**
 * Forms.js — Reusable form HTML builders.
 */

import { esc } from '../utils/format.js';

/**
 * Form to add a debtor ID to the current day.
 * Stays open after submit so several IDs can be added quickly.
 */
export function renderAddDebtorForm(form) {
  return `
    <div class="form-card">
      <div class="form-title">Agregar deudor a este día</div>
      <div class="form-row">
        <div class="form-field" style="max-width:200px">
          <label class="form-label">ID del deudor *</label>
          <input id="f-new-id" type="text" value="${esc(form.newId)}" placeholder="Ej: 77529" autocomplete="off" />
        </div>
        <div class="form-field">
          <label class="form-label">Nombre (opcional)</label>
          <input id="f-new-nombre" type="text" value="${esc(form.newNombre)}" placeholder="Nombre del deudor" autocomplete="off" />
        </div>
      </div>
      <div class="form-field">
        <label class="form-label">Nota / recordatorio del día (opcional)</label>
        <textarea id="f-new-nota" rows="2" placeholder="Ej: Llamar para recordar promesa de pago, enviar email de seguimiento…">${esc(form.newNota)}</textarea>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" id="btn-confirm-add-debtor">Agregar (Enter)</button>
        <button class="btn btn-secondary" id="btn-cancel-add-debtor">Cerrar</button>
      </div>
    </div>`;
}
