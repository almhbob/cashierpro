const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("cashierPro", {
  getVersion: () => ipcRenderer.invoke("get-app-version"),
});
