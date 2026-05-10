const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs   = require('fs');

// ─── Constants ─────────────────────────────────────────────────────────────
const IS_DEV   = process.argv.includes('--dev');
const DATA_DIR  = app.getPath('userData');
const DATA_FILE = path.join(DATA_DIR, 'cobranza-data.json');

let mainWindow;

// ─── Window ─────────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1150,
    height: 780,
    minWidth: 900,
    minHeight: 620,
    title: 'Agenda Cobranza — Hadad & Asociados',
    backgroundColor: '#F5F3EE',
    show: false, // show after ready-to-show for a cleaner launch
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (IS_DEV) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  Menu.setApplicationMenu(buildAppMenu());
}

// ─── App Menu ────────────────────────────────────────────────────────────────
function buildAppMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        { label: 'Exportar a CSV…', click: () => handleExportCSV() },
        { label: 'Exportar backup (JSON)…', click: () => handleExportJSON() },
        { label: 'Importar backup (JSON)…', click: () => handleImportJSON() },
        { type: 'separator' },
        { label: 'Abrir carpeta de datos', click: () => shell.openPath(DATA_DIR) },
        { type: 'separator' },
        { role: 'quit', label: 'Salir' },
      ],
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload', label: 'Recargar' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom normal' },
        { role: 'zoomIn',    label: 'Acercar' },
        { role: 'zoomOut',   label: 'Alejar' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla completa' },
        ...(IS_DEV ? [
          { type: 'separator' },
          { role: 'toggleDevTools', label: 'DevTools' },
        ] : []),
      ],
    },
    {
      label: 'Ayuda',
      submenu: [
        { label: 'Versión 1.0.0', enabled: false },
        { label: 'Ver archivo de datos', click: () => shell.showItemInFolder(DATA_FILE) },
      ],
    },
  ];
  return Menu.buildFromTemplate(template);
}

// ─── IPC — Storage ───────────────────────────────────────────────────────────
ipcMain.handle('storage:read', () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('[storage:read]', err);
  }
  return { debtors: {}, agenda: {} };
});

ipcMain.handle('storage:write', (_, data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[storage:write]', err);
    return false;
  }
});

// ─── IPC — Export / Import ───────────────────────────────────────────────────
ipcMain.handle('export:csv', async (_, csvContent) => {
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    title: 'Exportar cartera a CSV',
    defaultPath: `cobranza-${dateStamp()}.csv`,
    filters: [{ name: 'CSV', extensions: ['csv'] }],
  });
  if (canceled || !filePath) return false;
  try {
    fs.writeFileSync(filePath, '\uFEFF' + csvContent, 'utf-8'); // BOM for Excel
    shell.openPath(path.dirname(filePath));
    return true;
  } catch (err) { return false; }
});

async function handleExportCSV() {
  mainWindow.webContents.send('menu:export-csv');
}

async function handleExportJSON() {
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    title: 'Exportar backup JSON',
    defaultPath: `cobranza-backup-${dateStamp()}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (canceled || !filePath) return;
  try {
    const content = fs.existsSync(DATA_FILE)
      ? fs.readFileSync(DATA_FILE, 'utf-8')
      : '{}';
    fs.writeFileSync(filePath, content, 'utf-8');
    dialog.showMessageBox(mainWindow, { message: 'Backup exportado correctamente.', type: 'info' });
  } catch (err) {
    dialog.showErrorBox('Error', `No se pudo exportar: ${err.message}`);
  }
}

async function handleImportJSON() {
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
    title: 'Importar backup JSON',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile'],
  });
  if (canceled || !filePaths.length) return;
  const confirm = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: ['Importar y reemplazar', 'Cancelar'],
    defaultId: 1,
    message: 'Esto reemplazará todos los datos actuales.\n¿Continuar?',
  });
  if (confirm.response !== 0) return;
  try {
    const content = fs.readFileSync(filePaths[0], 'utf-8');
    JSON.parse(content); // validate
    fs.writeFileSync(DATA_FILE, content, 'utf-8');
    mainWindow.webContents.send('menu:data-imported');
  } catch (err) {
    dialog.showErrorBox('Error', `Archivo inválido: ${err.message}`);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function dateStamp() {
  return new Date().toISOString().split('T')[0];
}

// ─── App lifecycle ───────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
