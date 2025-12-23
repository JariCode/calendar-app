const { contextBridge, ipcRenderer } = require('electron');

// Expose a minimal, channel-restricted API to renderer.
// Only the needed operations are allowed to reduce attack surface.
contextBridge.exposeInMainWorld('electronAPI', {
  loadEvents: () => ipcRenderer.invoke('load-events'),
  saveEvents: (events) => ipcRenderer.invoke('save-events', events)
  ,
  // Register a callback that is invoked when the main process asks the
  // renderer to prepare for shutdown. Returns an unsubscribe function.
  onPrepareToClose: (cb) => {
    const listener = () => cb();
    ipcRenderer.on('prepare-to-close', listener);
    return () => ipcRenderer.removeListener('prepare-to-close', listener);
  },
  // Signal to main that renderer has finished its shutdown tasks.
  signalReadyToClose: () => ipcRenderer.send('renderer-ready')
});
