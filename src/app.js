/**
 * app.js — Application entry point.
 *
 * Boots the app: loads persisted data, subscribes to state,
 * renders the first view, and binds global toolbar events.
 */

import { loadData, saveData } from './utils/storage.js';
import { setData, subscribe, getState } from './store.js';
import { renderCurrentView, navigate } from './router.js';
import { bindToolbar } from './components/Toolbar.js';
import { buildAgendaExport } from './utils/format.js';
import { exportXLSX } from './utils/storage.js';

// ── Boot ─────────────────────────────────────────────────────────────────────
async function boot() {
  // 1. Load persisted data
  const raw  = await loadData();
  // Backward-compat: ensure notas exists for users with older data
  const data = { notas: {}, ...raw };
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

    // Esc → volver al calendario (salvo que se esté escribiendo en un campo)
    if (e.key === 'Escape') {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const { view } = getState();
      if (view !== 'calendar') navigate('calendar');
    }
  });
}

// ── Electron menu events (main → renderer) ───────────────────────────────────
function bindMenuEvents() {
  if (!window.electronAPI) return;

  // File → Export Excel
  window.electronAPI.onExportXLSX(async () => {
    await exportXLSX(buildAgendaExport(getState().data));
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
