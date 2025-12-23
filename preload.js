const { contextBridge, ipcRenderer } = require('electron');

// Expose a minimal, channel-restricted API to renderer.
// Only the needed operations are allowed to reduce attack surface.
contextBridge.exposeInMainWorld('electronAPI', {
  loadEvents: () => ipcRenderer.invoke('load-events'),
  saveEvents: (events) => ipcRenderer.invoke('save-events', events)
  ,
  saveEventsSync: (events) => ipcRenderer.sendSync('save-events-sync', events)
});
