const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("cashierPro", {
  getMachineId:    () => ipcRenderer.invoke("get-machine-id"),
  getLicenseInfo:  () => ipcRenderer.invoke("get-license-info"),
  activateLicense: (key) => ipcRenderer.invoke("activate-license", key),
  launchMainApp:   () => ipcRenderer.invoke("launch-main-app"),
  openExternal:    (url) => ipcRenderer.invoke("open-external", url),
});
