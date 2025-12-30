const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;
const fs = require('fs').promises;

// Lippu, joka kertoo onko sovellus jo käynnissä sulkemisprosessissa.
// Estää useamman kerran sulkemiskäsittelyn käynnistymisen.
let isQuitting = false;

// Palauttaa polun käyttäjän data-hakemistoon, johon tapahtumat tallennetaan.
// Käytetään `app.getPath('userData')`-hakemistoa, joka toimii eri alustoilla.
function getEventsPath() {
  return path.join(app.getPath('userData'), 'events.json');
}

// IPC-käsittelijä: lataa tapahtumat tallennetusta JSON-tiedostosta.
// Palauttaa taulukon tapahtumista tai tyhjän taulukon jos tiedostoa ei ole.
ipcMain.handle('load-events', async () => {
  const p = getEventsPath();
  try {
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    // Jos tiedostoa ei ole (ensikäynnistys), palauta tyhjä lista
    if (err.code === 'ENOENT') return [];
    throw err;
  }
});

// IPC-käsittelijä: tallentaa tapahtumat atomisesti levylle.
// Tallennus tapahtuu temp-tiedostiin ja nimenvaihdolla, jotta tiedosto
// ei jää korruptoituneeksi kirjoituskatkon tapahtuessa.
ipcMain.handle('save-events', async (event, events) => {
  const p = getEventsPath();
  const tmp = p + '.tmp';

  // Yksinkertainen validointi lähetyspayloadille
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
    // Varmistetaan että kohdehakemisto on olemassa
    await fs.mkdir(path.dirname(p), { recursive: true });
    // Sarjoitetaan JSON ja kirjoitetaan väliaikaiseen tiedostoon
    const data = JSON.stringify(events);
    await fs.writeFile(tmp, data, 'utf8');
    // Vaihdetaan nimi lopulliseksi tiedostoksi (atominen operaatio useimmissa järjestelmissä)
    await fs.rename(tmp, p);
    return { ok: true };
  } catch (err) {
    // Siivous jos temp-tiedosto jäi
    try { await fs.unlink(tmp); } catch (e) {}
    throw err;
  }
});

// HUOM: Synchronous IPC-handlerit on poistettu, jotta pääprosessi ei jää
// odottamaan renderöijää. Tässä sovelluksessa käytetään sulkemisen
// järjestettyä kättelyä: main lähettää 'prepare-to-close' rendererille,
// renderer tallentaa tilan asynkronisesti ja vastaa 'renderer-ready'.
// Seuraava listener odottaa tuota vastausta sulkemista varten.

ipcMain.on('renderer-ready', (event) => {
  // Paikalla oleva handler on tarkoituksella tyhjä; varsinaiset
  // kuuntelijat rekisteröidään dynaamisesti ikkunan sulkemiskäsittelyssä.
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Näytetään ikkuna vasta kun se on valmis
    // Aseta ikkunan kuvake (calendar.ico) (Macissa ja Linuxissa calendar.png) sovelluksen juurihakemistosta
    icon: path.join(__dirname, 'calendar.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Käynnistetään ikkuna maksimoituna, jotta käyttäjän ei tarvitse itse laajentaa ikkunaa.
  try { win.maximize(); } catch (e) { /* Joillain alustoilla maximize voi heittää virheen */ }

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Sulkemisen järjestetty kättely: pyydetään rendereria tallentamaan tila ennen sulkemista.
  win.on('close', (e) => {
    if (isQuitting) return; // Jo sulkemisprosessissa, sallitaan sulkeminen
    e.preventDefault();
    // Lähetä rendererille pyyntö valmistautua sulkemiseen
    try {
      win.webContents.send('prepare-to-close');
    } catch (err) {
      // Jos lähetys epäonnistuu (esim. renderer on jo kuollut), pakotetaan sulkeminen
      isQuitting = true;
      win.destroy();
      return;
    }

    // Odotetaan rendererin vastausta 'renderer-ready' tai ajatellaan aikakatkaisu
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
      // Aikakatkaisu: jos renderer ei vastaa, pakotetaan sulku
      isQuitting = true;
      try { win.destroy(); } catch (e) { win.close(); }
    }, TIMEOUT_MS);
  });

  // Debug-lokit: kirjaa latausvirheet ja konsoliviestit rendereristä
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    console.error('Window failed to load:', { errorCode, errorDescription, validatedURL, isMainFrame });
  });

  win.webContents.on('console-message', (e, level, message, line, sourceId) => {
    console.log('Renderer console:', { level, message, line, sourceId });
  });

  // Avataan DevTools vain kehityksessä tai jos ympäristömuuttuja erikseen sallii sen.
  if (isDev || process.env.DEBUG_ELECTRON === 'true') {
    try {
      win.webContents.openDevTools({ mode: 'detach' });
    } catch (e) {
      console.error('Failed to open devtools:', e);
    }
  }
}

// Rakentaa sovelluksen valikon suomenkielisillä nimillä.
// Poistamme tarkoituksella 'Ohje' ja 'Ikkuna' -valikot käyttäjän pyynnöstä.
function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    // macOS: lisää perussovellusvalikko käyttöjärjestelmän odottamalla tavalla
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about', label: `Tietoja ${app.name}` },
        { type: 'separator' },
        { role: 'services', label: 'Palvelut' },
        { type: 'separator' },
        { role: 'hide', label: 'Piilota' },
        { role: 'hideothers', label: 'Piilota muut' },
        { role: 'unhide', label: 'Näytä kaikki' },
        { type: 'separator' },
        { role: 'quit', label: 'Poistu' }
      ]
    }] : []),

    // Tiedosto-valikko: sulje ikkuna
    //Macissa kommentoidaan pois Tiedosto ja sulje, koska se on jo sovellusvalikossa.
    {
      label: 'Tiedosto',
      submenu: [
        { role: 'close', label: 'Sulje', accelerator: 'CmdOrCtrl+W' }
      ]
    },

    // Muokkaa-valikko: perinteiset edit-toiminnot
    {
      label: 'Muokkaa',
      submenu: [
        { role: 'undo', label: 'Kumoa' },
        { role: 'redo', label: 'Tee uudelleen' },
        { type: 'separator' },
        { role: 'cut', label: 'Leikkaa' },
        { role: 'copy', label: 'Kopioi' },
        { role: 'paste', label: 'Liitä' },
        { role: 'selectAll', label: 'Valitse kaikki' }
      ]
    },

    // Näytä-valikko: zoom ja koko näyttö. Emme lisää reload/devtools-kohtia.
    {
      label: 'Näytä',
      submenu: [
        { role: 'zoomin', label: 'Lähennä' },
        { role: 'zoomout', label: 'Loitonna' },
        { role: 'resetzoom', label: 'Palauta zoom' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Koko näyttö' }
      ]
    }
    // Huom: 'Ohje' ja 'Ikkuna' -valikot jätetty pois käyttäjän pyynnöstä
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();
});


app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});


