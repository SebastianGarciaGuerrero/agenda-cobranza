/**
 * DebtorView.js — Debtor detail: info cards, gestión history, forms.
 */

import { navigate }  from '../router.js';
import { getState, setUI, setForm, setData } from '../store.js';
import { saveData } from '../utils/storage.js';
import { formatShort, today, isPast, isOverduePromise } from '../utils/date.js';
import { formatMoney, generateId, esc } from '../utils/format.js';
import { renderTimeline }       from '../components/Timeline.js';
import { renderGestionForm, renderEditDebtorForm } from '../components/Forms.js';

// ── Upcoming agenda dates for this debtor ────────────────────────────────────
function upcomingDates(debtorId, agenda) {
  return Object.entries(agenda)
    .filter(([k, ids]) => ids.includes(debtorId) && k >= today())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 5)
    .map(([k]) => k);
}

// ── Overdue promises warning ─────────────────────────────────────────────────
function overdueWarning(gestiones) {
  const overdue = (gestiones || []).filter(isOverduePromise);
  if (!overdue.length) return '';
  return `<div class="overdue-banner">
    ⚠ ${overdue.length} promesa${overdue.length > 1 ? 's' : ''} vencida${overdue.length > 1 ? 's' : ''} sin registrar pago.
  </div>`;
}

// ── Render ────────────────────────────────────────────────────────────────────
export const DebtorView = {

  render(state) {
    const { selectedDebtorId, selectedDay, data, ui, form } = state;
    const deb   = data.debtors[selectedDebtorId] || { id: selectedDebtorId, gestiones: [] };
    const dates = upcomingDates(selectedDebtorId, data.agenda);

    const upcomingHtml = dates.length
      ? `<div class="upcoming-tags">
          ${dates.map(d => `<span class="upcoming-tag">📅 ${formatShort(d)}</span>`).join('')}
         </div>`
      : '';

    return `
      <h2 class="sr-only">Detalle del deudor ${selectedDebtorId}</h2>

      <!-- Header -->
      <div class="view-header">
        <div style="flex:1">
          <div class="view-title">
            ID ${esc(selectedDebtorId)}
            <button id="btn-copy-id" title="Copiar ID" style="margin-left:var(--s2);padding:2px 8px;font-size:var(--fs-xs);vertical-align:middle;cursor:pointer" class="btn btn-secondary btn-sm">Copiar</button>
            ${deb.nombre ? `<span style="font-weight:400;color:var(--text-secondary);font-size:var(--fs-lg);margin-left:var(--s3)">${esc(deb.nombre)}</span>` : ''}
          </div>
          ${deb.rut ? `<div class="view-subtitle">RUT ${esc(deb.rut)}</div>` : ''}
        </div>
        <button class="btn btn-secondary btn-sm" id="btn-toggle-edit">Editar info</button>
      </div>

      <!-- Upcoming dates -->
      ${upcomingHtml}

      <!-- Overdue warning -->
      ${overdueWarning(deb.gestiones)}

      <!-- Info cards -->
      <div class="info-cards">
        <div class="info-card">
          <div class="info-card-label">Deuda total</div>
          <div class="info-card-value">${formatMoney(deb.deudaTotal)}</div>
        </div>
        <div class="info-card">
          <div class="info-card-label">Saldo pendiente</div>
          <div class="info-card-value">${formatMoney(deb.saldo)}</div>
        </div>
        <div class="info-card">
          <div class="info-card-label">Estado</div>
          <div class="info-card-value" style="font-size:var(--fs-sm);text-transform:capitalize">
            ${esc((deb.estado || 'activo').replace(/_/g, ' '))}
          </div>
        </div>
        <div class="info-card">
          <div class="info-card-label">Gestiones</div>
          <div class="info-card-value">${(deb.gestiones || []).length}</div>
        </div>
      </div>

      <!-- Edit debtor form (toggle) -->
      ${ui.showEditDebtor ? renderEditDebtorForm(deb) : ''}

      <!-- Gestión history -->
      <div class="section-title">Historial de gestiones</div>

      ${!ui.showAddGestion
          ? `<button class="btn btn-secondary btn-sm" id="btn-show-gestion" style="margin-bottom:var(--s4)">+ Nueva gestión</button>`
          : ''}

      ${ui.showAddGestion ? renderGestionForm(form) : ''}

      ${renderTimeline(deb.gestiones)}`;
  },

  bindEvents() {
    // ── Copy ID to clipboard ─────────────────────────────────────────────────
    document.getElementById('btn-copy-id')?.addEventListener('click', () => {
      const { selectedDebtorId } = getState();
      navigator.clipboard.writeText(selectedDebtorId).then(() => {
        const btn = document.getElementById('btn-copy-id');
        if (btn) { btn.textContent = '¡Copiado!'; setTimeout(() => { btn.textContent = 'Copiar'; }, 1500); }
      });
    });

    // ── Toggle edit form ─────────────────────────────────────────────────────
    document.getElementById('btn-toggle-edit')?.addEventListener('click', () => {
      const { ui } = getState();
      setUI({ showEditDebtor: !ui.showEditDebtor });
    });

    document.getElementById('btn-cancel-edit')?.addEventListener('click', () => {
      setUI({ showEditDebtor: false });
    });

    document.getElementById('btn-save-edit')?.addEventListener('click', async () => {
      const { selectedDebtorId, data } = getState();
      const deb = { ...(data.debtors[selectedDebtorId] || { id: selectedDebtorId, gestiones: [] }) };

      const nombre = document.getElementById('f-e-nombre')?.value?.trim();
      const rut    = document.getElementById('f-e-rut')?.value?.trim();
      const deuda  = document.getElementById('f-e-deuda')?.value;
      const saldo  = document.getElementById('f-e-saldo')?.value;
      const estado = document.getElementById('f-e-estado')?.value;

      if (nombre !== undefined) deb.nombre = nombre;
      if (rut    !== undefined) deb.rut    = rut;
      if (deuda !== '')         deb.deudaTotal = Number(deuda);
      if (saldo !== '')         deb.saldo      = Number(saldo);
      if (estado)               deb.estado     = estado;

      data.debtors[selectedDebtorId] = deb;
      setData({ ...data });
      await saveData(getState().data);
      setUI({ showEditDebtor: false });
    });

    // ── Show gestión form ────────────────────────────────────────────────────
    document.getElementById('btn-show-gestion')?.addEventListener('click', () => {
      setUI({ showAddGestion: true });
    });

    document.getElementById('btn-cancel-gestion')?.addEventListener('click', () => {
      setUI({ showAddGestion: false });
    });

    // Live update form tipo → re-render the entire view so the form updates
    document.getElementById('f-g-tipo')?.addEventListener('change', e => {
      const nota  = document.getElementById('f-g-nota')?.value  || '';
      const fecha = document.getElementById('f-g-fecha')?.value || today();
      setForm({ gTipo: e.target.value, gNota: nota, gFecha: fecha });
      setUI({ showAddGestion: true }); // triggers full re-render via store
    });

    document.getElementById('btn-save-gestion')?.addEventListener('click', async () => {
      const { selectedDebtorId, data } = getState();

      const tipo      = document.getElementById('f-g-tipo')?.value        || 'otro';
      const fecha     = document.getElementById('f-g-fecha')?.value       || today();
      const nota      = document.getElementById('f-g-nota')?.value?.trim() || '';
      const pFecha    = document.getElementById('f-g-promesa-fecha')?.value || '';
      const pMontoRaw = document.getElementById('f-g-promesa-monto')?.value || '';
      const pagoRaw   = document.getElementById('f-g-pago')?.value         || '';

      // Ensure debtor exists
      if (!data.debtors[selectedDebtorId]) {
        data.debtors[selectedDebtorId] = { id: selectedDebtorId, gestiones: [] };
      }
      const deb = data.debtors[selectedDebtorId];

      // Build gestión object
      const gestion = { id: generateId(), fecha, tipo, nota };

      if (tipo === 'promesa' && pFecha) {
        gestion.pFecha = pFecha;
        gestion.pMonto = Number(pMontoRaw) || 0;
        // Auto-schedule debtor on the promise date
        if (!data.agenda[pFecha]) data.agenda[pFecha] = [];
        if (!data.agenda[pFecha].includes(selectedDebtorId)) {
          data.agenda[pFecha].push(selectedDebtorId);
        }
      }

      if ((tipo === 'pago' || tipo === 'abono') && pagoRaw) {
        gestion.pago = Number(pagoRaw) || 0;
        // Update saldo
        if (deb.saldo != null) {
          deb.saldo = Math.max(0, deb.saldo - gestion.pago);
        }
      }

      deb.gestiones.push(gestion);
      setData({ ...data });
      await saveData(getState().data);
      setUI({ showAddGestion: false });
      setForm({ gNota: '', gPromesaFecha: '', gPromesaMonto: '', gPago: '' });
    });

    // ── Delete gestión ───────────────────────────────────────────────────────
    document.querySelectorAll('.btn-delete-gestion').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar esta gestión?')) return;
        const gid = btn.dataset.gid;
        const { selectedDebtorId, data } = getState();
        const deb = data.debtors[selectedDebtorId];
        if (deb) {
          deb.gestiones = (deb.gestiones || []).filter(g => g.id !== gid);
          setData({ ...data });
          await saveData(getState().data);
        }
      });
    });
  },
};


