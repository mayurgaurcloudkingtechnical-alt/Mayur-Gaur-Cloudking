import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "path";

// 1. Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();

let mainWindow: BrowserWindow | null = null;

if (!gotTheLock) {
  // If another instance is running, exit immediately
  app.quit();
} else {
  app.on("second-instance", () => {
    // Focus existing window if a second instance attempts to launch
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

  function createWindow(): void {
    mainWindow = new BrowserWindow({
      width: 1280,
      height: 820,
      minWidth: 1024,
      minHeight: 700,
      title: "SoftLab Global LMS",
      backgroundColor: "#020617", // slate-950
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
      },
    });

    // Strip default menu bar in production for clean desktop feel
    if (!isDev) {
      mainWindow.setMenuBarVisibility(false);
    }

    // Intercept external links securely
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      // Prevent opening inside electron; open in user's default OS browser
      if (url.startsWith("http:") || url.startsWith("https:")) {
        shell.openExternal(url);
      }
      return { action: "deny" };
    });

    // Guard will-navigate events against unapproved navigation
    mainWindow.webContents.on("will-navigate", (event, url) => {
      const isLocalDev = url.startsWith("http://localhost:5173");
      const isLocalFile = url.startsWith("file://");

      if (!isLocalDev && !isLocalFile) {
        event.preventDefault();
        shell.openExternal(url);
      }
    });

    if (isDev && process.env.VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else if (isDev) {
      mainWindow.loadURL("http://localhost:5173");
    } else {
      mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
    }

    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  }

  // Register IPC Handlers
  ipcMain.handle("app:get-version", () => app.getVersion());
  ipcMain.handle("app:get-platform", () => process.platform);
  ipcMain.handle("app:get-backend-url", () => {
    return (
      process.env.BACKEND_URL ||
      (isDev ? "http://localhost:3000" : "https://www.softlabglobal.com")
    );
  });
  ipcMain.handle("app:ping", () => "pong");

  app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  // Graceful shutdown
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
