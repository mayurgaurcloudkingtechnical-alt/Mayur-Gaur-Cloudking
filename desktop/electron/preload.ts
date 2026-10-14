import { contextBridge, ipcRenderer } from "electron";

// Expose safe, isolated API to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  getAppVersion: (): Promise<string> => ipcRenderer.invoke("app:get-version"),
  getPlatform: (): Promise<string> => ipcRenderer.invoke("app:get-platform"),
  getBackendUrl: (): Promise<string> => ipcRenderer.invoke("app:get-backend-url"),
  ping: (): Promise<string> => ipcRenderer.invoke("app:ping"),

  auth: {
    login: (credentials: { identifier: string; password: string }) =>
      ipcRenderer.invoke("auth:login", credentials),
    restoreSession: () => ipcRenderer.invoke("auth:restore-session"),
    refreshToken: () => ipcRenderer.invoke("auth:refresh-token"),
    logout: () => ipcRenderer.invoke("auth:logout"),
    getDeviceId: (): Promise<string> => ipcRenderer.invoke("auth:get-device-id"),
    getCurrentUser: () => ipcRenderer.invoke("auth:get-current-user"),
  },
});
