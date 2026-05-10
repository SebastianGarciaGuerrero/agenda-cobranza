/**
 * store.js — Central application state.
 *
 * Simple reactive store: call setState() to update, subscribe() to listen.
 * Views should read state via getState() and update via setState/setUI/setForm.
 */

import { today } from './utils/date.js';

// ── Initial form state factory ───────────────────────────────────────────────
function makeForm() {
  return {
    // Add-debtor-to-day form
    newId:     '',
    newNombre: '',
    // Gestión form
    gTipo:        'llamada_si',
    gFecha:       today(),
    gNota:        '',
    gPromesaFecha:'',
    gPromesaMonto:'',
    gPago:        '',
    // Edit-debtor form
    eNombre: '',
    eRut:    '',
    eDeuda:  '',
    eSaldo:  '',
    eEstado: 'activo',
  };
}

// ── State object ─────────────────────────────────────────────────────────────
let state = {
  view: 'calendar',          // 'calendar' | 'day' | 'debtor'
  year:  new Date().getFullYear(),
  month: new Date().getMonth(),
  selectedDay:      null,    // 'YYYY-MM-DD' | null
  selectedDebtorId: null,    // string | null
  data: { debtors: {}, agenda: {} },

  ui: {
    showAddDebtor:   false,
    showAddGestion:  false,
    showEditDebtor:  false,
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
    ui:   { showAddDebtor: false, showAddGestion: false, showEditDebtor: false },
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
