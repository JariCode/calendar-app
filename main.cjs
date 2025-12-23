const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;
const fs = require('fs').promises;
const fsSync = require('fs');

function getEventsPath() {
  return path.join(app.getPath('userData'), 'events.json');
}

// IPC: load events from userData/events.json
ipcMain.handle('load-events', async () => {
  const p = getEventsPath();
  try {
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return []; // no file yet
    throw err;
  }
});

// IPC: save events atomically
ipcMain.handle('save-events', async (event, events) => {
  const p = getEventsPath();
  const tmp = p + '.tmp';

  function isValidEvents(evts) {
    if (!Array.isArray(evts)) return false;
    for (const it of evts) {
      if (it == null || typeof it !== 'object') return false;
      if (!('date' in it) || !('title' in it)) return false;
      if (typeof it.title !== 'string') return false;
      if (typeof it.date !== 'string') return false;
    }
    return true;
  }

  if (!isValidEvents(events)) {
    throw new Error('Invalid events payload');
  }

  try {
    await fs.mkdir(path.dirname(p), { recursive: true });
    // ensure we can stringify the payload
    const data = JSON.stringify(events);
    await fs.writeFile(tmp, data, 'utf8');
    await fs.rename(tmp, p);
    return { ok: true };
  } catch (err) {
    try { await fs.unlink(tmp); } catch (e) {}
    throw err;
  }
});

// Synchronous save handler for use during renderer unload/close
ipcMain.on('save-events-sync', (event, events) => {
  try {
    const p = getEventsPath();
    fsSync.mkdirSync(path.dirname(p), { recursive: true });
    const serializable = events.map(e => ({ ...e, date: e.date instanceof Date ? e.date.toISOString() : e.date }));
    fsSync.writeFileSync(p, JSON.stringify(serializable), 'utf8');
    event.returnValue = { ok: true };
  } catch (err) {
    console.error('save-events-sync failed:', err);
    try { event.returnValue = { ok: false, error: String(err) }; } catch (e) {}
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    // Set window/taskbar icon (use an .ico on Windows). Place `calendar.ico` next to main.cjs.
    icon: path.join(__dirname, 'calendar.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Debug hooks: log load failures and open devtools in packaged app to inspect white screen issues
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    console.error('Window failed to load:', { errorCode, errorDescription, validatedURL, isMainFrame });
  });

  win.webContents.on('console-message', (e, level, message, line, sourceId) => {
    console.log('Renderer console:', { level, message, line, sourceId });
  });

  // Only open DevTools in development or when explicitly enabled via env var
  if (isDev || process.env.DEBUG_ELECTRON === 'true') {
    try {
      win.webContents.openDevTools({ mode: 'detach' });
    } catch (e) {
      console.error('Failed to open devtools:', e);
    }
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Add IPC handlers here later if needed
