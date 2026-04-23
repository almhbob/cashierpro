const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("cashierPro", {
  getVersion:     () => ipcRenderer.invoke("get-app-version"),
  activate:       (code) => ipcRenderer.invoke("activate", code),
  launchMainApp:  () => ipcRenderer.invoke("launch-main-app"),
  openExternal:   (url) => ipcRenderer.invoke("open-external", url),
});
