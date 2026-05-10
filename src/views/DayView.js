/**
 * DayView.js — List of debtors scheduled for a specific day.
 */

import { navigate } from '../router.js';
import { getState, setUI, setForm, setData } from '../store.js';
import { saveData } from '../utils/storage.js';
import { formatLong, today } from '../utils/date.js';
import { formatMoney, esc } from '../utils/format.js';
import { badge, lastTipo } from '../components/Badge.js';
import { renderAddDebtorForm } from '../components/Forms.js';

// ── Render ────────────────────────────────────────────────────────────────────
export const DayView = {

  render(state) {
    const { selectedDay, data, ui, form } = state;
    const ids = data.agenda[selectedDay] || [];

    let debtorList;
    if (!ids.length) {
      debtorList = `<p class="empty-state">No hay deudores agendados para este día.<br>Usá el botón para agregar un ID.</p>`;
    } else {
      debtorList = `<div class="debtor-list">` + ids.map(id => {
        const deb  = data.debtors[id] || {};
        const tipo = lastTipo(deb);
        return `
          <div class="debtor-item" data-id="${esc(id)}">
            <div class="debtor-item-left">
              <span class="debtor-item-id">ID ${esc(id)}</span>
              <button class="btn btn-secondary btn-sm btn-copy-id" data-id="${esc(id)}" title="Copiar ID" style="font-size:11px;padding:1px 7px;margin-left:6px">Copiar</button>
              <span class="debtor-item-name">${esc(deb.nombre || 'Sin nombre')}</span>
            </div>
            <div class="debtor-item-right">
              ${deb.saldo != null ? `<span class="debtor-item-saldo">${formatMoney(deb.saldo)}</span>` : ''}
              ${badge(tipo)}
              <button class="btn-icon btn-rm-debtor" data-id="${esc(id)}" title="Quitar de este día" style="font-size:14px">×</button>
            </div>
          </div>`;
      }).join('') + `</div>`;
    }

    return `
      <h2 class="sr-only">Gestiones del día ${selectedDay}</h2>

      <div class="view-header">
        <button class="btn btn-secondary btn-sm" id="btn-back-calendar" style="margin-right:var(--s3)">← Volver</button>
        <div>
          <div class="view-title">${formatLong(selectedDay)}</div>
          <div class="view-subtitle">${ids.length} deudor${ids.length !== 1 ? 'es' : ''} agendado${ids.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      ${debtorList}

      ${ui.showAddDebtor
          ? renderAddDebtorForm(form)
          : `<div style="margin-top:var(--s4)">
               <button class="btn btn-secondary" id="btn-show-add-debtor">+ Agregar ID a este día</button>
             </div>`
      }`;
  },

  bindEvents() {
    const state = getState();

    // Back to calendar
    document.getElementById('btn-back-calendar')?.addEventListener('click', () => {
      navigate('calendar');
    });

    // Copy ID buttons
    document.querySelectorAll('.btn-copy-id').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        navigator.clipboard.writeText(btn.dataset.id).then(() => {
          btn.textContent = '¡Copiado!';
          setTimeout(() => { btn.textContent = 'Copiar'; }, 1500);
        });
      });
    });

    // Click debtor → go to debtor detail
    document.querySelectorAll('.debtor-item[data-id]').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('.btn-rm-debtor')) return;
        navigate('debtor', {
          selectedDebtorId: el.dataset.id,
          selectedDay: state.selectedDay,
        });
      });
    });

    // Remove debtor from this day
    document.querySelectorAll('.btn-rm-debtor').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        const id   = btn.dataset.id;
        const day  = getState().selectedDay;
        const data = getState().data;
        data.agenda[day] = (data.agenda[day] || []).filter(x => x !== id);
        setData({ ...data });
        await saveData(getState().data);
      });
    });

    // Show add-debtor form
    document.getElementById('btn-show-add-debtor')?.addEventListener('click', () => {
      setUI({ showAddDebtor: true });
      // re-render manually since setUI notifies store listener
    });

    // Cancel add-debtor
    document.getElementById('btn-cancel-add-debtor')?.addEventListener('click', () => {
      setUI({ showAddDebtor: false });
    });

    // Confirm add-debtor
    document.getElementById('btn-confirm-add-debtor')?.addEventListener('click', async () => {
      const id     = document.getElementById('f-new-id')?.value?.trim();
      const nombre = document.getElementById('f-new-nombre')?.value?.trim() || '';
      if (!id) {
        document.getElementById('f-new-id')?.focus();
        return;
      }

      const { selectedDay, data } = getState();

      // Add to agenda
      if (!data.agenda[selectedDay]) data.agenda[selectedDay] = [];
      if (!data.agenda[selectedDay].includes(id)) {
        data.agenda[selectedDay].push(id);
      }

      // Create debtor stub if not exists
      if (!data.debtors[id]) {
        data.debtors[id] = { id, nombre, gestiones: [] };
      } else if (nombre && !data.debtors[id].nombre) {
        data.debtors[id].nombre = nombre;
      }

      setData({ ...data });
      await saveData(getState().data);
      setUI({ showAddDebtor: false });
    });
  },
};
