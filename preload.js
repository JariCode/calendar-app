const { contextBridge, ipcRenderer } = require('electron');

// Preload-scriptin tehtävä on tarjota turvallinen rajapinta renderer-prosessille.
// Tässä avataan vain pienin mahdollinen API, jotta hyökkäyspinta-ala pysyy pienenä.
contextBridge.exposeInMainWorld('electronAPI', {
  // Lataa tallennetut tapahtumat main-prosessista (asynkroninen invoke)
  loadEvents: () => ipcRenderer.invoke('load-events'),

  // Tallenna tapahtumat main-prosessin kautta (asynkroninen invoke)
  saveEvents: (events) => ipcRenderer.invoke('save-events', events),

  // Rekisteröi callback, joka kutsutaan kun main kysyy rendereriltä
  // että se valmistautuisi sulkemiseen. Palauttaa unsubscribe-funktion.
  onPrepareToClose: (cb) => {
    const listener = () => cb();
    ipcRenderer.on('prepare-to-close', listener);
    return () => ipcRenderer.removeListener('prepare-to-close', listener);
  },

  // Lähetä main-prosessille, että renderer on valmis sulkeutumaan.
  signalReadyToClose: () => ipcRenderer.send('renderer-ready')
});
