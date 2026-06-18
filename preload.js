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
  exportXLSX: (payload) => ipcRenderer.invoke('export:xlsx', payload),

  // Menu events (main → renderer)
  onExportXLSX:   (fn) => ipcRenderer.on('menu:export-xlsx',   fn),
  onDataImported: (fn) => ipcRenderer.on('menu:data-imported', fn),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
