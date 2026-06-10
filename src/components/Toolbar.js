/**
 * Toolbar.js — Breadcrumb renderer, "Hoy" button, and global search binding.
 */

import { navigate } from '../router.js';
import { formatShort, today } from '../utils/date.js';
import { esc } from '../utils/format.js';

/** Renders the breadcrumb nav based on current state. */
export function renderBreadcrumb(state) {
  const el = document.getElementById('breadcrumb');
  if (!el) return;

  if (state.view === 'calendar') {
    el.innerHTML = '';
    return;
  }

  const parts = [];
  parts.push(`<span class="bc-item clickable" data-nav="calendar">Calendario</span>`);
  parts.push(`<span class="bc-sep">›</span>`);

  if (state.view === 'day') {
    parts.push(`<span class="bc-item">${formatShort(state.selectedDay)}</span>`);
  }

  if (state.view === 'search') {
    parts.push(`<span class="bc-item">Búsqueda: ID ${esc(state.searchId)}</span>`);
  }

  el.innerHTML = parts.join('');
  el.querySelector('[data-nav="calendar"]')?.addEventListener('click', () => navigate('calendar'));
}

/** Binds the "Hoy" button and global search (called once on startup). */
export function bindToolbar() {
  // Botón Hoy → día actual desde cualquier vista
  document.getElementById('btn-today')?.addEventListener('click', () => {
    const t = today();
    navigate('day', {
      selectedDay: t,
      year:  Number(t.slice(0, 4)),
      month: Number(t.slice(5, 7)) - 1,
    });
  });

  // Búsqueda por ID → vista de días agendados
  const input = document.getElementById('global-search');
  const btn   = document.getElementById('search-btn');

  const doSearch = () => {
    const id = input?.value?.trim();
    if (!id) return;
    input.value = '';
    input.blur();
    navigate('search', { searchId: id });
  };

  input?.addEventListener('keydown', e => {
    e.stopPropagation(); // que Esc no navegue mientras se escribe
    if (e.key === 'Enter')  doSearch();
    if (e.key === 'Escape') input.blur();
  });
  btn?.addEventListener('click', doSearch);
}
