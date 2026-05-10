/**
 * Toolbar.js — Breadcrumb renderer and global search binding.
 */

import { navigate } from '../router.js';
import { formatShort } from '../utils/date.js';
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

  if (state.view === 'day') {
    parts.push(`<span class="bc-item clickable" data-nav="calendar">Calendario</span>`);
    parts.push(`<span class="bc-sep">›</span>`);
    parts.push(`<span class="bc-item">${formatShort(state.selectedDay)}</span>`);
  }

  if (state.view === 'debtor') {
    parts.push(`<span class="bc-item clickable" data-nav="calendar">Calendario</span>`);
    if (state.selectedDay) {
      parts.push(`<span class="bc-sep">›</span>`);
      parts.push(`<span class="bc-item clickable" data-nav="day">${formatShort(state.selectedDay)}</span>`);
    }
    parts.push(`<span class="bc-sep">›</span>`);
    parts.push(`<span class="bc-item">ID ${esc(state.selectedDebtorId)}</span>`);
  }

  el.innerHTML = parts.join('');

  // Bind breadcrumb navigation clicks
  el.querySelector('[data-nav="calendar"]')?.addEventListener('click', () => navigate('calendar'));
  el.querySelector('[data-nav="day"]')?.addEventListener('click', () => navigate('day'));
}

/** Binds the global search input and button (called once on startup). */
export function bindToolbar() {
  const input = document.getElementById('global-search');
  const btn   = document.getElementById('search-btn');

  const doSearch = () => {
    const id = input?.value?.trim();
    if (!id) return;
    input.value = '';
    navigate('debtor', { selectedDebtorId: id, selectedDay: null });
  };

  input?.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
  btn?.addEventListener('click', doSearch);
}
