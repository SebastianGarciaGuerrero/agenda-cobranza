/**
 * store.js — Central application state.
 *
 * Simple reactive store: call setState() to update, subscribe() to listen.
 * Views should read state via getState() and update via setState/setUI/setForm.
 */

// ── Initial form state factory ───────────────────────────────────────────────
function makeForm() {
  return {
    // Add-debtor-to-day form
    newId:     '',
    newNombre: '',
    newNota:   '',
  };
}

// ── State object ─────────────────────────────────────────────────────────────
let state = {
  view: 'calendar',          // 'calendar' | 'day' | 'search'
  year:  new Date().getFullYear(),
  month: new Date().getMonth(),
  selectedDay: null,         // 'YYYY-MM-DD' | null
  searchId:    null,         // string | null — ID being searched
  data: { debtors: {}, agenda: {}, notas: {} },

  ui: {
    showAddDebtor: false,
  },

  form: makeForm(),
};

const listeners = new Set();

// ── Public API ───────────────────────────────────────────────────────────────

export const getState = () => state;

/** Merge top-level updates and notify all listeners. */
export function setState(updates) {
  state = { ...state, ...updates };
  _notify();
}

/** Merge UI flag updates and notify. */
export function setUI(updates) {
  state = { ...state, ui: { ...state.ui, ...updates } };
  _notify();
}

/** Merge form field updates (does NOT notify — forms re-render explicitly). */
export function setForm(updates) {
  state = { ...state, form: { ...state.form, ...updates } };
}

/** Replace the data object and notify. */
export function setData(data) {
  state = { ...state, data };
  _notify();
}

/** Reset UI flags and form to defaults. */
export function resetUI() {
  state = {
    ...state,
    ui:   { showAddDebtor: false },
    form: makeForm(),
  };
}

/** Subscribe to state changes. Returns an unsubscribe function. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function _notify() {
  listeners.forEach(fn => fn(state));
}
