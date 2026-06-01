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

/** Trigger a CSV export via the native save dialog. */
export async function exportCSV(csvContent) {
  if (isElectron()) {
    return await window.electronAPI.exportCSV(csvContent);
  }
  // Browser fallback
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `cobranza-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}
