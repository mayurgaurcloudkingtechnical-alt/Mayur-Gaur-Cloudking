import { contextBridge, ipcRenderer } from "electron";

// Expose safe, isolated API to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  getAppVersion: (): Promise<string> => ipcRenderer.invoke("app:get-version"),
  getPlatform: (): Promise<string> => ipcRenderer.invoke("app:get-platform"),
  getBackendUrl: (): Promise<string> => ipcRenderer.invoke("app:get-backend-url"),
  ping: (): Promise<string> => ipcRenderer.invoke("app:ping"),
});
