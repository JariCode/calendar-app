const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;
const fs = require('fs').promises;
const fsSync = require('fs');

let isQuitting = false;

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
      if (!('date' in it) || !('text' in it)) return false;
      if (typeof it.text !== 'string') return false;
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

// NOTE: synchronous IPC handler has been removed to avoid blocking the
// main thread. Instead the app uses an orderly shutdown handshake:
// main sends 'prepare-to-close' to renderer; renderer saves and
// replies with 'renderer-ready'. Below we listen for that reply when
// initiating window close.

ipcMain.on('renderer-ready', (event) => {
  // Intentionally empty: listeners are attached dynamically during close.
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

  // Graceful shutdown handshake: ask renderer to persist state before closing.
  win.on('close', (e) => {
    if (isQuitting) return; // already proceeding to close
    e.preventDefault();
    // Send prepare signal to renderer
    try {
      win.webContents.send('prepare-to-close');
    } catch (err) {
      // If we can't send, allow close to proceed
      isQuitting = true;
      win.destroy();
      return;
    }

    // Wait for renderer to reply on 'renderer-ready' or timeout
    const TIMEOUT_MS = 2000;
    let finished = false;
    const onReady = (event) => {
      finished = true;
      isQuitting = true;
      try { win.destroy(); } catch (e) { win.close(); }
    };

    ipcMain.once('renderer-ready', onReady);

    setTimeout(() => {
      if (finished) return;
      ipcMain.removeListener('renderer-ready', onReady);
      isQuitting = true;
      try { win.destroy(); } catch (e) { win.close(); }
    }, TIMEOUT_MS);
  });

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
