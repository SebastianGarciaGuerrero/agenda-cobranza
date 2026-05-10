/**
 * CalendarView.js — Month calendar grid.
 */

import { navigate } from '../router.js';
import { setState, getState } from '../store.js';
import { MESES, DIAS_SEMANA } from '../utils/constants.js';
import { daysInMonth, firstDayOfMonth, buildKey, today } from '../utils/date.js';
import { toCSV } from '../utils/format.js';
import { exportCSV } from '../utils/storage.js';
import { lastTipo } from '../components/Badge.js';

// ── Pill CSS class based on last gestión type ────────────────────────────────
function pillClass(tipo) {
  if (tipo === 'promesa') return 'cal-pill promesa';
  if (tipo === 'pago' || tipo === 'abono') return 'cal-pill pagado';
  if (tipo === 'caido' || tipo === 'negativa') return 'cal-pill caido';
  if (tipo === 'acuerdo') return 'cal-pill acuerdo';
  return 'cal-pill default';
}

// ── Mini stats ───────────────────────────────────────────────────────────────
function renderStats(data) {
  const debtors  = Object.values(data.debtors);
  const total    = debtors.length;
  const conProm  = debtors.filter(d => lastTipo(d) === 'promesa').length;
  const pagados  = debtors.filter(d => ['pago','abono'].includes(lastTipo(d))).length;
  const caidos   = debtors.filter(d => ['caido','negativa'].includes(lastTipo(d))).length;

  return `
    <div class="metrics-row">
      <div class="metric-card">
        <div class="metric-label">Total deudores</div>
        <div class="metric-value">${total}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Con promesa</div>
        <div class="metric-value accent">${conProm}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Pagaron</div>
        <div class="metric-value success">${pagados}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Caídos / Negativa</div>
        <div class="metric-value danger">${caidos}</div>
      </div>
    </div>`;
}

// ── Render ───────────────────────────────────────────────────────────────────
export const CalendarView = {

  render(state) {
    const { year, month, data } = state;
    const todayStr  = today();
    const firstDay  = firstDayOfMonth(year, month);
    const numDays   = daysInMonth(year, month);

    // Day-of-week headers
    const dowHeaders = DIAS_SEMANA
      .map(d => `<div class="cal-dow">${d}</div>`)
      .join('');

    // Empty cells before the 1st
    const emptyCells = Array(firstDay).fill('<div class="cal-cell empty"></div>').join('');

    // Day cells
    const dayCells = Array.from({ length: numDays }, (_, i) => {
      const day = i + 1;
      const key = buildKey(year, month, day);
      const ids = data.agenda[key] || [];
      const isToday = key === todayStr;
      const hasPills = ids.length > 0;

      const pills = ids.slice(0, 4).map(id => {
        const deb  = data.debtors[id];
        const tipo = lastTipo(deb);
        return `<div class="${pillClass(tipo)}">${id}</div>`;
      }).join('');

      const more = ids.length > 4
        ? `<div class="cal-pill-more">+${ids.length - 4} más</div>`
        : '';

      return `
        <div class="cal-cell${isToday ? ' today' : ''}${hasPills ? ' has-items' : ''}"
             data-day="${key}">
          <div class="cal-day-num">${day}</div>
          ${pills}${more}
        </div>`;
    }).join('');

    return `
      <h2 class="sr-only">Calendario de gestiones</h2>

      <div class="cal-nav">
        <div class="cal-nav-btns">
          <button class="nav-btn" id="btn-prev-month">&#8592;</button>
          <button class="nav-btn" id="btn-next-month">&#8594;</button>
        </div>
        <span class="cal-month-label">${MESES[month]} ${year}</span>
        <button class="btn btn-secondary btn-sm" id="btn-export-csv">Exportar CSV</button>
      </div>

      <div class="cal-grid">
        ${dowHeaders}
        ${emptyCells}
        ${dayCells}
      </div>`;
  },

  bindEvents() {
    const state = getState();

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

    document.querySelectorAll('.cal-cell[data-day]').forEach(el => {
      el.addEventListener('click', () => {
        navigate('day', { selectedDay: el.dataset.day });
      });
    });

    document.getElementById('btn-export-csv')?.addEventListener('click', async () => {
      const csv = toCSV(getState().data.debtors);
      await exportCSV(csv);
    });
  },
};
