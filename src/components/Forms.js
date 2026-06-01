/**
 * Forms.js — Reusable form HTML builders.
 */

import { TIPOS_GESTION, ESTADOS_DEUDOR } from '../utils/constants.js';
import { esc } from '../utils/format.js';
import { today } from '../utils/date.js';

/**
 * Form to add a debtor ID to the current day.
 */
export function renderAddDebtorForm(form) {
  return `
    <div class="form-card">
      <div class="form-title">Agregar deudor a este día</div>
      <div class="form-row">
        <div class="form-field">
          <label class="form-label">ID del deudor *</label>
          <input id="f-new-id" type="text" value="${esc(form.newId)}" placeholder="Ej: 77529" autocomplete="off" />
        </div>
        <div class="form-field">
          <label class="form-label">Nombre (opcional)</label>
          <input id="f-new-nombre" type="text" value="${esc(form.newNombre)}" placeholder="Nombre del deudor" />
        </div>
      </div>
      <div class="form-field">
        <label class="form-label">Nota / recordatorio del día (opcional)</label>
        <textarea id="f-new-nota" rows="2" placeholder="Ej: Llamar para recordar promesa de pago, enviar email de seguimiento…">${esc(form.newNota)}</textarea>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" id="btn-confirm-add-debtor">Agregar</button>
        <button class="btn btn-secondary" id="btn-cancel-add-debtor">Cancelar</button>
      </div>
    </div>`;
}

/**
 * Form to log a new gestión for a debtor.
 */
export function renderGestionForm(form) {
  const tipo = form.gTipo;
  const isPromesa = tipo === 'promesa';
  const isPago    = tipo === 'pago' || tipo === 'abono';

  const tipoOptions = Object.entries(TIPOS_GESTION)
    .map(([k, v]) => `<option value="${k}"${k === tipo ? ' selected' : ''}>${v.label}</option>`)
    .join('');

  return `
    <div class="form-card">
      <div class="form-title">Nueva gestión</div>
      <div class="form-row">
        <div class="form-field">
          <label class="form-label">Tipo de gestión</label>
          <select id="f-g-tipo">${tipoOptions}</select>
        </div>
        <div class="form-field">
          <label class="form-label">Fecha</label>
          <input id="f-g-fecha" type="date" value="${esc(form.gFecha || today())}" />
        </div>
      </div>

      ${isPromesa ? `
      <div class="form-row">
        <div class="form-field">
          <label class="form-label">Fecha promesa de pago</label>
          <input id="f-g-promesa-fecha" type="date" value="${esc(form.gPromesaFecha)}" />
        </div>
        <div class="form-field">
          <label class="form-label">Monto prometido ($)</label>
          <input id="f-g-promesa-monto" type="number" value="${esc(form.gPromesaMonto)}" placeholder="0" min="0" />
        </div>
      </div>` : ''}

      ${isPago ? `
      <div class="form-row">
        <div class="form-field" style="max-width:220px">
          <label class="form-label">Monto pagado ($)</label>
          <input id="f-g-pago" type="number" value="${esc(form.gPago)}" placeholder="0" min="0" />
        </div>
      </div>` : ''}

      <div class="form-field">
        <label class="form-label">Notas</label>
        <textarea id="f-g-nota" placeholder="Detalles de la gestión…">${esc(form.gNota)}</textarea>
      </div>

      <div class="form-actions">
        <button class="btn btn-primary" id="btn-save-gestion">Guardar gestión</button>
        <button class="btn btn-secondary" id="btn-cancel-gestion">Cancelar</button>
      </div>
    </div>`;
}

/**
 * Form to edit debtor info.
 */
export function renderEditDebtorForm(deb) {
  const estadoOptions = ESTADOS_DEUDOR
    .map(e => `<option value="${e.value}"${(deb.estado || 'activo') === e.value ? ' selected' : ''}>${e.label}</option>`)
    .join('');

  return `
    <div class="form-card">
      <div class="form-title">Editar información del deudor</div>
      <div class="form-row">
        <div class="form-field">
          <label class="form-label">Nombre completo</label>
          <input id="f-e-nombre" type="text" value="${esc(deb.nombre || '')}" placeholder="Nombre" />
        </div>
        <div class="form-field" style="max-width:180px">
          <label class="form-label">RUT</label>
          <input id="f-e-rut" type="text" value="${esc(deb.rut || '')}" placeholder="9.735.118-K" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label class="form-label">Deuda total ($)</label>
          <input id="f-e-deuda" type="number" value="${esc(deb.deudaTotal ?? '')}" placeholder="0" min="0" />
        </div>
        <div class="form-field">
          <label class="form-label">Saldo pendiente ($)</label>
          <input id="f-e-saldo" type="number" value="${esc(deb.saldo ?? '')}" placeholder="0" min="0" />
        </div>
        <div class="form-field">
          <label class="form-label">Estado</label>
          <select id="f-e-estado">${estadoOptions}</select>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" id="btn-save-edit">Guardar</button>
        <button class="btn btn-secondary" id="btn-cancel-edit">Cancelar</button>
      </div>
    </div>`;
}
