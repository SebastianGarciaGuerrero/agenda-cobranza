/**
 * router.js — Renders the active view and manages navigation.
 */

import { getState, setState, resetUI } from './store.js';
import { CalendarView } from './views/CalendarView.js';
import { DayView      } from './views/DayView.js';
import { SearchView   } from './views/SearchView.js';
import { renderBreadcrumb } from './components/Toolbar.js';

const VIEWS = {
  calendar: CalendarView,
  day:      DayView,
  search:   SearchView,
};

// Tracks the last view+params so we only reset scroll on real navigation,
// not on data updates (e.g. saving a nota at the bottom of a long list).
let lastViewKey = '';

/**
 * Navigate to a view, optionally updating state params.
 * @param {'calendar'|'day'|'search'} view
 * @param {object} [params]  — e.g. { selectedDay, searchId }
 */
export function navigate(view, params = {}) {
  resetUI();
  setState({ view, ...params });
  // setState triggers the store listener in app.js which calls renderCurrentView()
}

/** Re-render the current view (called by store subscriber in app.js). */
export function renderCurrentView() {
  const state = getState();
  const container = document.getElementById('app');
  if (!container) return;

  const View = VIEWS[state.view];
  if (!View) {
    container.innerHTML = `<p class="empty-state">Vista no encontrada: ${state.view}</p>`;
    return;
  }

  container.innerHTML = View.render(state);
  container.dataset.view = state.view;

  // Reset scroll only when the view (or its target) actually changed
  const viewKey = `${state.view}|${state.selectedDay}|${state.searchId}`;
  if (viewKey !== lastViewKey) {
    container.scrollTop = 0;
    lastViewKey = viewKey;
  }

  View.bindEvents?.();
  renderBreadcrumb(state);
}
