/**
 * preload.js — Secure bridge between Electron main process and renderer.
 * Only exposes the specific APIs the renderer needs; nothing else.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Storage
  readData:  ()     => ipcRenderer.invoke('storage:read'),
  writeData: (data) => ipcRenderer.invoke('storage:write', data),

  // Export
  exportCSV: (csv) => ipcRenderer.invoke('export:csv', csv),

  // Menu events (main → renderer)
  onExportCSV:    (fn) => ipcRenderer.on('menu:export-csv',    fn),
  onDataImported: (fn) => ipcRenderer.on('menu:data-imported', fn),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
