/**
 * app.js — Application entry point.
 *
 * Boots the app: loads persisted data, subscribes to state,
 * renders the first view, and binds global toolbar events.
 */

import { loadData, saveData } from './utils/storage.js';
import { setData, subscribe, getState } from './store.js';
import { renderCurrentView } from './router.js';
import { bindToolbar } from './components/Toolbar.js';
import { toCSV } from './utils/format.js';
import { exportCSV } from './utils/storage.js';

// ── Boot ─────────────────────────────────────────────────────────────────────
async function boot() {
  // 1. Load persisted data
  const data = await loadData();
  setData(data);

  // 2. Subscribe store → re-render on every state change
  subscribe(() => renderCurrentView());

  // 3. Render initial view (triggers via subscribe)
  renderCurrentView();

  // 4. Bind toolbar search and global shortcuts
  bindToolbar();
  bindGlobalShortcuts();
  bindMenuEvents();
}

// ── Global keyboard shortcuts ────────────────────────────────────────────────
function bindGlobalShortcuts() {
  document.addEventListener('keydown', e => {
    // Ctrl/Cmd + F → focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      document.getElementById('global-search')?.focus();
    }
  });
}

// ── Electron menu events (main → renderer) ───────────────────────────────────
function bindMenuEvents() {
  if (!window.electronAPI) return;

  // File → Export CSV
  window.electronAPI.onExportCSV(async () => {
    const csv = toCSV(getState().data.debtors);
    await exportCSV(csv);
  });

  // File → Import backup (JSON imported in main process; just reload data)
  window.electronAPI.onDataImported(async () => {
    const data = await loadData();
    setData(data);
  });
}

// ── Start ─────────────────────────────────────────────────────────────────────
boot().catch(err => {
  console.error('[boot]', err);
  document.getElementById('app').innerHTML = `
    <div class="empty-state">
      <p>Error al iniciar la aplicación.</p>
      <p style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:var(--s2)">${err.message}</p>
    </div>`;
});
