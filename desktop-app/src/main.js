/**
 * CashierPro Desktop — Electron Main Process
 * نظام كاشير برو المكتبي — العملية الرئيسية
 */

const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require("electron");
const path = require("path");
const { checkActivation, activate } = require("./activation");

// رابط التطبيق السحابي — غيّره لرابط نشرك
const APP_URL = "https://supermarket-pos.replit.app";

let mainWindow = null;
let activateWindow = null;

const isDev = process.env.NODE_ENV === "development";

/* ─── إعداد التطبيق ──────────────────── */
app.setName("كاشير برو");
app.setAppUserModelId("com.cashierpro.desktop");

// منع تشغيل أكثر من نسخة في نفس الوقت
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const win = mainWindow || activateWindow;
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

/* ─── الأيقونة ───────────────────────── */
const ICON_PATH = (() => {
  const p = path.join(__dirname, "../build/icon.ico");
  try { require("fs").accessSync(p); return p; } catch { return undefined; }
})();

/* ─── القائمة الرئيسية ───────────────── */
function buildMenu() {
  const template = [
    {
      label: "كاشير برو",
      submenu: [
        { label: "عن التطبيق", click: showAbout },
        { type: "separator" },
        { label: "فتح في المتصفح", click: () => shell.openExternal(APP_URL) },
        { type: "separator" },
        { label: "إغلاق", accelerator: "Alt+F4", click: () => app.quit() },
      ],
    },
    {
      label: "عرض",
      submenu: [
        { label: "تحديث", accelerator: "F5", click: () => mainWindow?.webContents.reload() },
        { label: "تحديث كامل", accelerator: "Ctrl+Shift+R", click: () => mainWindow?.webContents.reloadIgnoringCache() },
        { type: "separator" },
        { label: "تكبير", role: "zoomIn" },
        { label: "تصغير", role: "zoomOut" },
        { label: "الحجم الطبيعي", role: "resetZoom" },
        { type: "separator" },
        { label: "ملء الشاشة", accelerator: "F11", role: "togglefullscreen" },
        ...(isDev ? [{ type: "separator" }, { label: "أدوات المطور", accelerator: "F12", click: () => mainWindow?.webContents.toggleDevTools() }] : []),
      ],
    },
    {
      label: "مساعدة",
      submenu: [
        { label: "واتساب: +966530658285", click: () => shell.openExternal("https://wa.me/966530658285") },
        { label: "البريد: Almhbob.iii@gmail.com", click: () => shell.openExternal("mailto:Almhbob.iii@gmail.com") },
        { type: "separator" },
        { label: "عن التطبيق", click: showAbout },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function showAbout() {
  dialog.showMessageBox(mainWindow || activateWindow, {
    type: "info",
    title: "عن كاشير برو",
    message: "كاشير برو — CashierPro v1.0.0",
    detail:
      "نظام إدارة المتاجر والسوبر ماركت السحابي\n\n" +
      "المطوّر: Abdullah Almhbob\n" +
      "واتساب: +966530658285\n" +
      "البريد: Almhbob.iii@gmail.com\n\n" +
      "© 2025 CashierPro — جميع الحقوق محفوظة",
    buttons: ["موافق"],
  });
}

/* ─── صفحة عدم الاتصال ───────────────── */
function getOfflineHTML() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',Tahoma,sans-serif; background:linear-gradient(135deg,#0d9488,#064e3b); min-height:100vh; display:flex; align-items:center; justify-content:center; color:white; }
    .card { text-align:center; padding:60px 48px; background:rgba(255,255,255,.1); border-radius:28px; backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,.2); max-width:420px; }
    .icon { font-size:80px; margin-bottom:24px; }
    h1 { font-size:28px; font-weight:800; margin-bottom:8px; }
    p { font-size:15px; opacity:.8; line-height:1.6; margin-bottom:32px; }
    button { background:white; color:#0d9488; border:none; border-radius:14px; padding:14px 36px; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; }
    button:hover { transform:scale(1.03); }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📡</div>
    <h1>كاشير برو</h1>
    <p>لا يوجد اتصال بالإنترنت<br/>يرجى التحقق من الاتصال ثم المحاولة مجددًا</p>
    <button onclick="location.reload()">🔄 إعادة المحاولة</button>
  </div>
</body>
</html>`;
}

/* ─── نافذة التفعيل ──────────────────── */
function createActivateWindow() {
  activateWindow = new BrowserWindow({
    width: 520, height: 660,
    resizable: false, center: true,
    title: "تفعيل كاشير برو",
    ...(ICON_PATH ? { icon: ICON_PATH } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
    show: false,
  });

  activateWindow.loadFile(path.join(__dirname, "../renderer/activate.html"));
  activateWindow.once("ready-to-show", () => activateWindow.show());
  activateWindow.on("closed", () => { activateWindow = null; });
}

/* ─── النافذة الرئيسية ───────────────── */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 900,
    minWidth: 1024, minHeight: 700,
    center: true,
    title: "كاشير برو",
    ...(ICON_PATH ? { icon: ICON_PATH } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      partition: "persist:cashierpro",
    },
    autoHideMenuBar: false,
    show: false,
    backgroundColor: "#0f172a",
  });

  buildMenu();
  mainWindow.loadURL(APP_URL);
  mainWindow.once("ready-to-show", () => { mainWindow.show(); mainWindow.focus(); });

  mainWindow.webContents.on("did-fail-load", (_e, code) => {
    if (code === -3) return;
    mainWindow.webContents.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(getOfflineHTML())}`
    );
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL)) { shell.openExternal(url); return { action: "deny" }; }
    return { action: "allow" };
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

/* ─── دورة حياة التطبيق ──────────────── */
app.whenReady().then(async () => {
  const status = checkActivation();

  if (status.activated) {
    // مفعّل — افتح مباشرةً
    createMainWindow();
  } else {
    // غير مفعّل — أظهر نافذة التفعيل
    createActivateWindow();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const s = checkActivation();
      if (s.activated) createMainWindow();
      else createActivateWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

/* ─── IPC Handlers ────────────────────── */
ipcMain.handle("get-app-version", () => app.getVersion());

ipcMain.handle("activate", async (_event, code) => {
  return activate(code);
});

ipcMain.handle("launch-main-app", () => {
  if (activateWindow) activateWindow.close();
  createMainWindow();
});

ipcMain.handle("open-external", (_event, url) => shell.openExternal(url));
