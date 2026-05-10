/**
 * router.js — Renders the active view and manages navigation.
 */

import { getState, setState, resetUI } from './store.js';
import { CalendarView } from './views/CalendarView.js';
import { DayView       } from './views/DayView.js';
import { DebtorView    } from './views/DebtorView.js';
import { renderBreadcrumb } from './components/Toolbar.js';

const VIEWS = {
  calendar: CalendarView,
  day:      DayView,
  debtor:   DebtorView,
};

/**
 * Navigate to a view, optionally updating state params.
 * @param {'calendar'|'day'|'debtor'} view
 * @param {object} [params]  — e.g. { selectedDay, selectedDebtorId }
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
  View.bindEvents?.();
  renderBreadcrumb(state);
}
