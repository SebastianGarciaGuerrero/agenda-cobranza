/**
 * CalendarView.js — Month calendar grid (Mon–Fri only).
 */

import { navigate } from '../router.js';
import { setState, getState } from '../store.js';
import { MESES, DIAS_SEMANA } from '../utils/constants.js';
import { daysInMonth, firstDayOfMonth, buildKey, today } from '../utils/date.js';
import { buildAgendaExport } from '../utils/format.js';
import { exportXLSX } from '../utils/storage.js';
import { lastTipo } from '../components/Badge.js';

// ── Pill CSS class based on debtor state ─────────────────────────────────────
function pillClass(deb) {
  if (deb?.pagado) return 'cal-pill pagado';
  const tipo = lastTipo(deb);
  if (tipo === 'promesa') return 'cal-pill promesa';
  if (tipo === 'pago' || tipo === 'abono') return 'cal-pill pagado';
  if (tipo === 'caido' || tipo === 'negativa') return 'cal-pill caido';
  if (tipo === 'acuerdo') return 'cal-pill acuerdo';
  return 'cal-pill default';
}

// ── Render ───────────────────────────────────────────────────────────────────
export const CalendarView = {

  render(state) {
    const { year, month, data } = state;
    const todayStr  = today();
    const firstDay  = firstDayOfMonth(year, month); // 0=Sun … 6=Sat
    const numDays   = daysInMonth(year, month);
    const isCurrentMonth = Number(todayStr.slice(0, 4)) === year &&
                           Number(todayStr.slice(5, 7)) - 1 === month;

    // Day-of-week headers (Mon–Fri only)
    const dowHeaders = DIAS_SEMANA
      .map(d => `<div class="cal-dow">${d}</div>`)
      .join('');

    // Empty cells before the 1st workday (week starts on Monday)
    // If month starts on Sat(6) or Sun(0) the first rendered day is Monday → offset 0
    const startOffset = (firstDay === 0 || firstDay === 6) ? 0 : firstDay - 1;
    const emptyCells = Array(startOffset).fill('<div class="cal-cell empty"></div>').join('');

    // Day cells — skip Saturdays (6) and Sundays (0)
    const dayCells = Array.from({ length: numDays }, (_, i) => {
      const day = i + 1;
      const dow = new Date(year, month, day).getDay();
      if (dow === 0 || dow === 6) return '';
      const key = buildKey(year, month, day);
      const ids = data.agenda[key] || [];
      const isToday = key === todayStr;
      const hasPills = ids.length > 0;

      const pills = ids.slice(0, 4).map(id => {
        const deb = data.debtors[id];
        return `<div class="${pillClass(deb)}">${id}</div>`;
      }).join('');

      const more = ids.length > 4
        ? `<div class="cal-pill-more">+${ids.length - 4} más</div>`
        : '';

      return `
        <div class="cal-cell${isToday ? ' today' : ''}${hasPills ? ' has-items' : ''}"
             data-day="${key}">
          <div class="cal-day-head">
            <span class="cal-day-num">${day}</span>
            ${hasPills ? `<span class="cal-day-count">${ids.length}</span>` : ''}
          </div>
          ${pills}${more}
        </div>`;
    }).join('');

    return `
      <h2 class="sr-only">Calendario de gestiones</h2>

      <div class="cal-nav">
        <div class="cal-nav-btns">
          <button class="nav-btn" id="btn-prev-month" title="Mes anterior">←</button>
          <button class="nav-btn" id="btn-next-month" title="Mes siguiente">→</button>
          ${!isCurrentMonth ? `<button class="btn btn-secondary btn-sm" id="btn-cal-today">Mes actual</button>` : ''}
        </div>
        <span class="cal-month-label">${MESES[month]} ${year}</span>
        <button class="btn btn-secondary btn-sm" id="btn-export-csv">Exportar a Excel</button>
      </div>

      <div class="cal-grid">
        ${dowHeaders}
        ${emptyCells}
        ${dayCells}
      </div>`;
  },

  bindEvents() {

    document.getElementById('btn-prev-month')?.addEventListener('click', () => {
      let { year, month } = getState();
      month--;
      if (month < 0) { month = 11; year--; }
      setState({ year, month });
    });

    document.getElementById('btn-next-month')?.addEventListener('click', () => {
      let { year, month } = getState();
      month++;
      if (month > 11) { month = 0; year++; }
      setState({ year, month });
    });

    document.getElementById('btn-cal-today')?.addEventListener('click', () => {
      const now = new Date();
      setState({ year: now.getFullYear(), month: now.getMonth() });
    });

    document.querySelectorAll('.cal-cell[data-day]').forEach(el => {
      el.addEventListener('click', () => {
        navigate('day', { selectedDay: el.dataset.day });
      });
    });

    document.getElementById('btn-export-csv')?.addEventListener('click', async () => {
      await exportXLSX(buildAgendaExport(getState().data));
    });
  },
};
