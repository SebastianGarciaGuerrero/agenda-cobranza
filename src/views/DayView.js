/**
 * DayView.js — Pantalla de trabajo del día: deudores agendados con
 * notas inline y acciones rápidas (reagendar, pagado, quitar).
 */

import { navigate } from '../router.js';
import { getState, setUI, setData } from '../store.js';
import { saveData } from '../utils/storage.js';
import { formatLong, formatShort, today, addBusinessDays, toBusinessDay, addDays } from '../utils/date.js';
import { esc } from '../utils/format.js';
import { renderAddDebtorForm } from '../components/Forms.js';

// ── Badge del deudor ──────────────────────────────────────────────────────────
function debtorBadge(deb) {
  if (deb?.pagado) return `<span class="badge badge-pago">✓ Pagado</span>`;
  return '';
}

// ── Días futuros donde este ID también está agendado ─────────────────────────
function otherDays(id, agenda, currentDay) {
  return Object.keys(agenda)
    .filter(day => day !== currentDay && (agenda[day] || []).includes(id) && day >= today())
    .sort();
}

// ── Render ────────────────────────────────────────────────────────────────────
export const DayView = {

  render(state) {
    const { selectedDay, data, ui, form } = state;
    const ids   = data.agenda[selectedDay] || [];
    const notas = data.notas?.[selectedDay] || {};
    const isToday = selectedDay === today();

    let debtorList;
    if (!ids.length) {
      debtorList = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <p>No hay deudores agendados para este día.</p>
          <p class="empty-state-hint">Usá el botón de abajo para agregar un ID.</p>
        </div>`;
    } else {
      debtorList = `<div class="debtor-list">` + ids.map(id => {
        const deb  = data.debtors[id] || {};
        const nota = notas[id] || '';
        const others = otherDays(id, data.agenda, selectedDay);

        return `
          <div class="debtor-item${deb.pagado ? ' is-pagado' : ''}" data-id="${esc(id)}">

            <div class="debtor-item-row">
              <div class="debtor-item-left">
                <span class="debtor-item-id">ID ${esc(id)}</span>
                <span class="debtor-item-name">${esc(deb.nombre || 'Sin nombre')}</span>
              </div>
              <div class="debtor-item-right">
                ${others.length ? `<span class="other-days-tag" title="También agendado: ${others.map(formatShort).join(', ')}">📅 +${others.length} día${others.length > 1 ? 's' : ''}</span>` : ''}
                ${debtorBadge(deb)}
              </div>
            </div>

            <div class="debtor-item-nota-row" data-id="${esc(id)}" title="Clic para editar nota">
              ${nota
                ? `<span class="nota-icon">📝</span><span class="nota-text">${esc(nota)}</span>`
                : `<span class="nota-empty">+ Agregar nota para este día</span>`
              }
            </div>

            <div class="debtor-item-actions">
              <button class="action-btn btn-copy-id" data-id="${esc(id)}" title="Copiar ID al portapapeles">⧉ Copiar</button>
              <button class="action-btn btn-reagendar" data-id="${esc(id)}" title="Agendar este ID en otro día">↻ Reagendar</button>
              <button class="action-btn ${deb.pagado ? 'is-active' : ''} btn-pagado" data-id="${esc(id)}" title="${deb.pagado ? 'Desmarcar pagado' : 'Marcar pagado y quitar de los demás días'}">✓ Pagado</button>
              <span class="actions-spacer"></span>
              <button class="action-btn action-btn-danger btn-rm-debtor" data-id="${esc(id)}" title="Quitar de este día (borra la nota)">× Quitar</button>
            </div>

            <div class="reagendar-panel" data-id="${esc(id)}" hidden>
              <span class="reagendar-label">Agendar también el:</span>
              <button class="chip btn-quick-date" data-id="${esc(id)}" data-days="1">Mañana</button>
              <button class="chip btn-quick-date" data-id="${esc(id)}" data-days="2">+2 días</button>
              <button class="chip btn-quick-date" data-id="${esc(id)}" data-days="5">+1 semana</button>
              <input type="date" class="reagendar-date" data-id="${esc(id)}" />
              <button class="chip chip-primary btn-custom-date" data-id="${esc(id)}">Agendar</button>
            </div>

          </div>`;
      }).join('') + `</div>`;
    }

    return `
      <h2 class="sr-only">Gestiones del día ${selectedDay}</h2>

      <div class="view-header">
        <button class="btn btn-secondary btn-sm" id="btn-back-calendar" title="Volver al calendario (Esc)">← Calendario</button>
        ${!isToday ? `<button class="btn btn-secondary btn-sm" id="btn-go-today" title="Ir al día de hoy">Hoy</button>` : ''}
        <div style="flex:1">
          <div class="view-title">${formatLong(selectedDay)}${isToday ? ' <span class="today-tag">HOY</span>' : ''}</div>
          <div class="view-subtitle">${ids.length} deudor${ids.length !== 1 ? 'es' : ''} agendado${ids.length !== 1 ? 's' : ''}</div>
        </div>
        <div class="day-nav-btns">
          <button class="nav-btn" id="btn-prev-day" title="Día hábil anterior">←</button>
          <button class="nav-btn" id="btn-next-day" title="Día hábil siguiente">→</button>
        </div>
      </div>

      ${debtorList}

      ${ui.showAddDebtor
          ? renderAddDebtorForm(form)
          : `<div style="margin-top:var(--s4)">
               <button class="btn btn-primary" id="btn-show-add-debtor">+ Agregar ID a este día</button>
             </div>`
      }`;
  },

  bindEvents() {

    // ── Navegación ────────────────────────────────────────────────────────────
    document.getElementById('btn-back-calendar')?.addEventListener('click', () => {
      navigate('calendar');
    });

    document.getElementById('btn-go-today')?.addEventListener('click', () => {
      const t = today();
      navigate('day', { selectedDay: t, year: Number(t.slice(0, 4)), month: Number(t.slice(5, 7)) - 1 });
    });

    // Día hábil anterior / siguiente
    const shiftDay = delta => {
      const { selectedDay } = getState();
      let next = selectedDay;
      do { next = addDays(next, delta); } while (next !== toBusinessDay(next));
      navigate('day', { selectedDay: next });
    };
    document.getElementById('btn-prev-day')?.addEventListener('click', () => shiftDay(-1));
    document.getElementById('btn-next-day')?.addEventListener('click', () => shiftDay(1));

    // ── Copiar ID ─────────────────────────────────────────────────────────────
    document.querySelectorAll('.btn-copy-id').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.id).then(() => {
          btn.textContent = '✓ Copiado';
          btn.classList.add('is-active');
          setTimeout(() => {
            btn.textContent = '⧉ Copiar';
            btn.classList.remove('is-active');
          }, 1400);
        });
      });
    });

    // ── Reagendar: mostrar/ocultar panel ──────────────────────────────────────
    document.querySelectorAll('.btn-reagendar').forEach(btn => {
      btn.addEventListener('click', () => {
        const panel = document.querySelector(`.reagendar-panel[data-id="${btn.dataset.id}"]`);
        if (panel) panel.hidden = !panel.hidden;
      });
    });

    // Agendar el ID en otra fecha (compartido por chips y fecha custom)
    const scheduleOn = async (id, dateStr) => {
      const date = toBusinessDay(dateStr);
      const data = getState().data;
      if (!data.agenda[date]) data.agenda[date] = [];
      if (!data.agenda[date].includes(id)) data.agenda[date].push(id);
      setData({ ...data });
      await saveData(getState().data);
    };

    // Chips rápidos: mañana / +2 días / +1 semana (días hábiles)
    document.querySelectorAll('.btn-quick-date').forEach(btn => {
      btn.addEventListener('click', async () => {
        const { selectedDay } = getState();
        const target = addBusinessDays(selectedDay, Number(btn.dataset.days));
        await scheduleOn(btn.dataset.id, target);
      });
    });

    // Fecha custom
    document.querySelectorAll('.btn-custom-date').forEach(btn => {
      btn.addEventListener('click', async () => {
        const input = document.querySelector(`.reagendar-date[data-id="${btn.dataset.id}"]`);
        if (!input?.value) { input?.focus(); return; }
        await scheduleOn(btn.dataset.id, input.value);
      });
    });

    // ── Pagado: marcar y quitar de los demás días ────────────────────────────
    document.querySelectorAll('.btn-pagado').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const { selectedDay, data } = getState();
        const deb = data.debtors[id] || (data.debtors[id] = { id, nombre: '', gestiones: [] });

        if (deb.pagado) {
          // Desmarcar (no restaura los días eliminados)
          deb.pagado = false;
          delete deb.pagadoFecha;
        } else {
          if (!confirm(`¿Marcar ID ${id} como pagado?\nSe quitará de todos los demás días de la agenda.`)) return;
          deb.pagado = true;
          deb.pagadoFecha = today();
          // Quitar de todos los días excepto el actual (notas incluidas)
          for (const day of Object.keys(data.agenda)) {
            if (day === selectedDay) continue;
            if ((data.agenda[day] || []).includes(id)) {
              data.agenda[day] = data.agenda[day].filter(x => x !== id);
              if (!data.agenda[day].length) delete data.agenda[day];
              if (data.notas?.[day]?.[id]) delete data.notas[day][id];
            }
          }
        }

        setData({ ...data });
        await saveData(getState().data);
      });
    });

    // ── Quitar deudor del día (y su nota) ────────────────────────────────────
    document.querySelectorAll('.btn-rm-debtor').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id   = btn.dataset.id;
        const day  = getState().selectedDay;
        const data = getState().data;

        data.agenda[day] = (data.agenda[day] || []).filter(x => x !== id);
        if (!data.agenda[day].length) delete data.agenda[day];
        if (data.notas?.[day]?.[id]) delete data.notas[day][id];

        setData({ ...data });
        await saveData(getState().data);
      });
    });

    // ── Nota: click en la fila → edición inline ───────────────────────────────
    document.querySelectorAll('.debtor-item-nota-row').forEach(row => {
      row.addEventListener('click', e => {
        e.stopPropagation();
        if (row.querySelector('.nota-edit-input')) return; // ya está editando

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
        input.setSelectionRange(input.value.length, input.value.length);

        input.addEventListener('keydown', ev => {
          // Evitar que el Esc global navegue al calendario mientras se edita
          ev.stopPropagation();
          if (ev.key === 'Enter' && !ev.shiftKey) {
            ev.preventDefault();
            row.querySelector('.btn-save-nota').click();
          }
          if (ev.key === 'Escape') {
            row.querySelector('.btn-cancel-nota').click();
          }
        });

        row.querySelector('.btn-save-nota').addEventListener('click', async () => {
          const value = input.value.trim();
          const { selectedDay, data } = getState();
          if (!data.notas)              data.notas = {};
          if (!data.notas[selectedDay]) data.notas[selectedDay] = {};
          if (value) {
            data.notas[selectedDay][id] = value;
          } else {
            delete data.notas[selectedDay][id];
          }
          setData({ ...data });
          await saveData(getState().data);
        });

        row.querySelector('.btn-cancel-nota').addEventListener('click', () => {
          setData({ ...getState().data });
        });
      });
    });

    // ── Agregar deudor ────────────────────────────────────────────────────────
    document.getElementById('btn-show-add-debtor')?.addEventListener('click', () => {
      setUI({ showAddDebtor: true });
      document.getElementById('f-new-id')?.focus();
    });

    document.getElementById('btn-cancel-add-debtor')?.addEventListener('click', () => {
      setUI({ showAddDebtor: false });
    });

    const confirmAdd = async () => {
      const id     = document.getElementById('f-new-id')?.value?.trim();
      const nombre = document.getElementById('f-new-nombre')?.value?.trim() || '';
      const nota   = document.getElementById('f-new-nota')?.value?.trim()   || '';
      if (!id) {
        document.getElementById('f-new-id')?.focus();
        return;
      }

      const { selectedDay, data } = getState();

      if (!data.agenda[selectedDay]) data.agenda[selectedDay] = [];
      if (!data.agenda[selectedDay].includes(id)) {
        data.agenda[selectedDay].push(id);
      }

      if (!data.debtors[id]) {
        data.debtors[id] = { id, nombre, gestiones: [] };
      } else if (nombre && !data.debtors[id].nombre) {
        data.debtors[id].nombre = nombre;
      }

      if (nota) {
        if (!data.notas)              data.notas = {};
        if (!data.notas[selectedDay]) data.notas[selectedDay] = {};
        data.notas[selectedDay][id] = nota;
      }

      setData({ ...data });
      await saveData(getState().data);

      // Mantener el form abierto para cargar varios IDs seguidos
      const idInput = document.getElementById('f-new-id');
      if (idInput) {
        idInput.value = '';
        document.getElementById('f-new-nombre').value = '';
        document.getElementById('f-new-nota').value   = '';
        idInput.focus();
      }
    };

    document.getElementById('btn-confirm-add-debtor')?.addEventListener('click', confirmAdd);

    // Enter en los campos del form → agregar directo
    ['f-new-id', 'f-new-nombre'].forEach(fid => {
      document.getElementById(fid)?.addEventListener('keydown', e => {
        e.stopPropagation(); // que Esc no navegue mientras se escribe
        if (e.key === 'Enter') { e.preventDefault(); confirmAdd(); }
      });
    });
    document.getElementById('f-new-nota')?.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); confirmAdd(); }
    });
  },
};
