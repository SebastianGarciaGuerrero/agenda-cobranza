/**
 * SearchView.js — Resultado de búsqueda por ID: muestra en qué días
 * de la agenda aparece ese deudor, con sus notas.
 */

import { navigate } from '../router.js';
import { getState } from '../store.js';
import { formatLong, today } from '../utils/date.js';
import { esc } from '../utils/format.js';

export const SearchView = {

  render(state) {
    const { searchId, data } = state;
    const deb = data.debtors[searchId];
    const t   = today();

    // Todos los días donde aparece este ID, ordenados
    const days = Object.keys(data.agenda)
      .filter(day => (data.agenda[day] || []).includes(searchId))
      .sort();

    const upcoming = days.filter(d => d >= t);
    const past     = days.filter(d => d < t).reverse(); // más reciente primero

    const dayRow = (day, isPast) => {
      const nota = data.notas?.[day]?.[searchId] || '';
      return `
        <div class="search-day-row${isPast ? ' is-past' : ''}" data-day="${esc(day)}">
          <div class="search-day-date">
            ${formatLong(day)}${day === t ? ' <span class="today-tag">HOY</span>' : ''}
          </div>
          ${nota ? `<div class="search-day-nota">📝 ${esc(nota)}</div>` : ''}
        </div>`;
    };

    let body;
    if (!days.length) {
      body = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <p>El ID <strong>${esc(searchId)}</strong> no está agendado en ningún día.</p>
        </div>`;
    } else {
      body = `
        ${upcoming.length ? `
          <div class="section-title">Próximos días (${upcoming.length})</div>
          <div class="search-day-list">${upcoming.map(d => dayRow(d, false)).join('')}</div>` : ''}
        ${past.length ? `
          <div class="section-title">Días pasados (${past.length})</div>
          <div class="search-day-list">${past.map(d => dayRow(d, true)).join('')}</div>` : ''}
      `;
    }

    return `
      <h2 class="sr-only">Búsqueda: ${esc(searchId)}</h2>

      <div class="view-header">
        <button class="btn btn-secondary btn-sm" id="btn-back-calendar" title="Volver al calendario (Esc)">← Calendario</button>
        <div>
          <div class="view-title">
            ID ${esc(searchId)}
            ${deb?.pagado ? `<span class="badge badge-pago" style="vertical-align:middle;margin-left:var(--s2)">✓ Pagado</span>` : ''}
          </div>
          <div class="view-subtitle">${deb?.nombre ? esc(deb.nombre) + ' · ' : ''}${days.length} día${days.length !== 1 ? 's' : ''} en agenda</div>
        </div>
      </div>

      ${body}`;
  },

  bindEvents() {
    document.getElementById('btn-back-calendar')?.addEventListener('click', () => {
      navigate('calendar');
    });

    document.querySelectorAll('.search-day-row[data-day]').forEach(el => {
      el.addEventListener('click', () => {
        navigate('day', { selectedDay: el.dataset.day });
      });
    });
  },
};
