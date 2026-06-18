/**
 * storage.js — Data persistence abstraction.
 *
 * In Electron: reads/writes a JSON file in userData via IPC.
 * In browser (dev): falls back to localStorage.
 */

const isElectron = () => typeof window !== 'undefined' && !!window.electronAPI;

/** Load all app data. Returns { debtors, agenda }. */
export async function loadData() {
  if (isElectron()) {
    return await window.electronAPI.readData();
  }
  // Browser fallback (development only)
  const stored = localStorage.getItem('cobranza-data');
  return stored ? JSON.parse(stored) : { debtors: {}, agenda: {}, notas: {} };
}

/** Persist all app data. */
export async function saveData(data) {
  if (isElectron()) {
    return await window.electronAPI.writeData(data);
  }
  localStorage.setItem('cobranza-data', JSON.stringify(data));
  return true;
}

/**
 * Trigger an Excel (.xlsx) export via the native save dialog.
 * @param {{headers: string[], rows: string[][], sheetName?: string}} payload
 */
export async function exportXLSX(payload) {
  if (isElectron()) {
    return await window.electronAPI.exportXLSX(payload);
  }
  // Browser fallback (dev only): descarga un CSV con punto y coma
  const sep   = ';';
  const lines = [payload.headers, ...payload.rows]
    .map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(sep))
    .join('\r\n');
  const blob = new Blob(['\uFEFF' + lines], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `agenda-cobranza-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}
