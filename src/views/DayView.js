/**
 * DayView.js — List of debtors scheduled for a specific day.
 */

import { navigate } from '../router.js';
import { getState, setUI, setData } from '../store.js';
import { saveData } from '../utils/storage.js';
import { formatLong } from '../utils/date.js';
import { formatMoney, esc } from '../utils/format.js';
import { badge, lastTipo } from '../components/Badge.js';
import { renderAddDebtorForm } from '../components/Forms.js';

// ── Render ────────────────────────────────────────────────────────────────────
export const DayView = {

  render(state) {
    const { selectedDay, data, ui, form } = state;
    const ids   = data.agenda[selectedDay] || [];
    const notas = data.notas?.[selectedDay] || {};

    let debtorList;
    if (!ids.length) {
      debtorList = `<p class="empty-state">No hay deudores agendados para este día.<br>Usá el botón para agregar un ID.</p>`;
    } else {
      debtorList = `<div class="debtor-list">` + ids.map(id => {
        const deb  = data.debtors[id] || {};
        const tipo = lastTipo(deb);
        const nota = notas[id] || '';
        return `
          <div class="debtor-item" data-id="${esc(id)}">
            <div class="debtor-item-row">
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
            </div>
            <div class="debtor-item-nota-row" data-id="${esc(id)}" title="Clic para editar nota">
              ${nota
                ? `<span class="nota-icon">📝</span><span class="nota-text">${esc(nota)}</span>`
                : `<span class="nota-empty">+ Agregar nota para este día</span>`
              }
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

    // ── Volver al calendario ──────────────────────────────────────────────────
    document.getElementById('btn-back-calendar')?.addEventListener('click', () => {
      navigate('calendar');
    });

    // ── Copiar ID ─────────────────────────────────────────────────────────────
    document.querySelectorAll('.btn-copy-id').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        navigator.clipboard.writeText(btn.dataset.id).then(() => {
          btn.textContent = '¡Copiado!';
          setTimeout(() => { btn.textContent = 'Copiar'; }, 1500);
        });
      });
    });

    // ── Click en el item → ir al deudor (excepto nota y botones) ─────────────
    document.querySelectorAll('.debtor-item[data-id]').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('.btn-rm-debtor'))        return;
        if (e.target.closest('.btn-copy-id'))          return;
        if (e.target.closest('.debtor-item-nota-row')) return; // nota maneja su propio click
        navigate('debtor', {
          selectedDebtorId: el.dataset.id,
          selectedDay: state.selectedDay,
        });
      });
    });

    // ── Quitar deudor del día (y su nota) ────────────────────────────────────
    document.querySelectorAll('.btn-rm-debtor').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        const id   = btn.dataset.id;
        const day  = getState().selectedDay;
        const data = getState().data;

        data.agenda[day] = (data.agenda[day] || []).filter(x => x !== id);

        // Borrar la nota de este día también
        if (data.notas?.[day]?.[id]) {
          delete data.notas[day][id];
        }

        setData({ ...data });
        await saveData(getState().data);
      });
    });

    // ── Nota: click en la fila → edición inline ───────────────────────────────
    document.querySelectorAll('.debtor-item-nota-row').forEach(row => {
      row.addEventListener('click', e => {
        e.stopPropagation(); // no abrir el deudor

        // Si ya está en modo edición, no hacer nada
        if (row.querySelector('.nota-edit-input')) return;

        const id      = row.dataset.id;
        const current = row.querySelector('.nota-text')?.textContent || '';

        row.innerHTML = `
          <textarea class="nota-edit-input" rows="2"
            placeholder="Escribí tu recordatorio para este día…">${esc(current)}</textarea>
          <div class="nota-edit-actions">
            <button class="btn btn-primary btn-sm btn-save-nota">Guardar</button>
            <button class="btn btn-secondary btn-sm btn-cancel-nota">Cancelar</button>
          </div>`;

        const input = row.querySelector('.nota-edit-input');
        input.focus();
        // Mover cursor al final
        input.setSelectionRange(input.value.length, input.value.length);

        // Guardar con Enter (sin Shift)
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            row.querySelector('.btn-save-nota').click();
          }
          if (e.key === 'Escape') {
            row.querySelector('.btn-cancel-nota').click();
          }
        });

        // Guardar
        row.querySelector('.btn-save-nota').addEventListener('click', async () => {
          const value = input.value.trim();
          const { selectedDay, data } = getState();
          if (!data.notas)             data.notas = {};
          if (!data.notas[selectedDay]) data.notas[selectedDay] = {};
          if (value) {
            data.notas[selectedDay][id] = value;
          } else {
            delete data.notas[selectedDay][id];
          }
          setData({ ...data });
          await saveData(getState().data);
        });

        // Cancelar → re-render para restaurar
        row.querySelector('.btn-cancel-nota').addEventListener('click', () => {
          setData({ ...getState().data });
        });
      });
    });

    // ── Mostrar form agregar deudor ───────────────────────────────────────────
    document.getElementById('btn-show-add-debtor')?.addEventListener('click', () => {
      setUI({ showAddDebtor: true });
    });

    // ── Cancelar agregar deudor ───────────────────────────────────────────────
    document.getElementById('btn-cancel-add-debtor')?.addEventListener('click', () => {
      setUI({ showAddDebtor: false });
    });

    // ── Confirmar agregar deudor ──────────────────────────────────────────────
    document.getElementById('btn-confirm-add-debtor')?.addEventListener('click', async () => {
      const id     = document.getElementById('f-new-id')?.value?.trim();
      const nombre = document.getElementById('f-new-nombre')?.value?.trim() || '';
      const nota   = document.getElementById('f-new-nota')?.value?.trim()   || '';
      if (!id) {
        document.getElementById('f-new-id')?.focus();
        return;
      }

      const { selectedDay, data } = getState();

      // Agregar a la agenda
      if (!data.agenda[selectedDay]) data.agenda[selectedDay] = [];
      if (!data.agenda[selectedDay].includes(id)) {
        data.agenda[selectedDay].push(id);
      }

      // Crear stub del deudor si no existe
      if (!data.debtors[id]) {
        data.debtors[id] = { id, nombre, gestiones: [] };
      } else if (nombre && !data.debtors[id].nombre) {
        data.debtors[id].nombre = nombre;
      }

      // Guardar nota del día
      if (nota) {
        if (!data.notas)              data.notas = {};
        if (!data.notas[selectedDay]) data.notas[selectedDay] = {};
        data.notas[selectedDay][id] = nota;
      }

      setData({ ...data });
      await saveData(getState().data);
      setUI({ showAddDebtor: false });
    });
  },
};
