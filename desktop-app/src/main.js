/**
 * CashierPro Desktop — Main Electron Process
 * Handles: window management, license validation, local server startup
 */

const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const { verifyLicense, activateLicense, getMachineId, getLicenseInfo } = require("./license-validator");
const { startServer, stopServer } = require("./local-server");

let mainWindow = null;
let licenseWindow = null;
let localPort = null;

/* ─── App Config ──────────────────────────────── */
app.setName("كاشير برو");
app.setAppUserModelId("com.cashierpro.desktop");

// Cloud URL used for the main POS window (set at build time)
const APP_URL = process.env.APP_URL || "https://cashierpro.replit.app";

// Check if the local React build is available (renderer/dist/index.html)
const { existsSync } = require("fs");
const RENDERER_DIST = path.join(__dirname, "../renderer/dist/index.html");
const HAS_LOCAL_FRONTEND = existsSync(RENDERER_DIST);

// Icon path (optional — gracefully skip if missing)
const ICON_PATH = (() => {
  const p = path.join(__dirname, "../build/icon.ico");
  try { require("fs").accessSync(p); return p; } catch { return undefined; }
})();

/* ─── Window Factories ────────────────────────── */
function createLicenseWindow() {
  licenseWindow = new BrowserWindow({
    width: 520,
    height: 680,
    resizable: false,
    center: true,
    title: "تفعيل كاشير برو",
    ...(ICON_PATH ? { icon: ICON_PATH } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
  });

  licenseWindow.loadFile(path.join(__dirname, "../renderer/license.html"));
  licenseWindow.on("closed", () => { licenseWindow = null; });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    center: true,
    title: "كاشير برو",
    ...(ICON_PATH ? { icon: ICON_PATH } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      // Allow the cloud URL to use session cookies
      partition: "persist:cashierpro",
    },
    autoHideMenuBar: true,
    show: false,
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  // Load local server (offline) if frontend is bundled, otherwise use cloud URL
  const loadTarget = HAS_LOCAL_FRONTEND
    ? `http://127.0.0.1:${localPort}`
    : APP_URL;
  mainWindow.loadURL(loadTarget);
  mainWindow.on("closed", () => { mainWindow = null; });
}

/* ─── IPC Handlers ────────────────────────────── */
ipcMain.handle("get-machine-id", () => getMachineId());
ipcMain.handle("get-license-info", () => getLicenseInfo());

ipcMain.handle("activate-license", async (_event, key) => {
  return await activateLicense(key);
});

ipcMain.handle("launch-main-app", () => {
  if (licenseWindow) licenseWindow.close();
  createMainWindow();
});

ipcMain.handle("open-external", (_event, url) => shell.openExternal(url));

/* ─── App Lifecycle ───────────────────────────── */
app.whenReady().then(async () => {
  // Start local API server
  localPort = startServer(7777);

  // Verify license
  const result = await verifyLicense();

  if (result.valid) {
    createMainWindow();
  } else {
    createLicenseWindow();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  stopServer();
  if (process.platform !== "darwin") app.quit();
});

app.on("quit", stopServer);
