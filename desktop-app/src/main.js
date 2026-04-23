/**
 * CashierPro Desktop — Electron Main Process
 * نظام كاشير برو المكتبي
 */

const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require("electron");
const path = require("path");

// رابط التطبيق السحابي
const APP_URL = "https://supermarket-pos.replit.app";

let mainWindow = null;

const isDev = process.env.NODE_ENV === "development";

/* ─── إعداد التطبيق ──────────────────── */
app.setName("كاشير برو");
app.setAppUserModelId("com.cashierpro.desktop");

// منع تشغيل أكثر من نسخة واحدة في نفس الوقت
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

/* ─── القائمة الرئيسية ───────────────── */
function buildMenu() {
  const template = [
    {
      label: "كاشير برو",
      submenu: [
        { label: "عن التطبيق", click: showAbout },
        { type: "separator" },
        {
          label: "فتح الرابط في المتصفح",
          click: () => shell.openExternal(APP_URL),
        },
        { type: "separator" },
        { label: "إخفاء", accelerator: "CmdOrCtrl+H", role: "hide" },
        { type: "separator" },
        { label: "إغلاق", accelerator: "Alt+F4", click: () => app.quit() },
      ],
    },
    {
      label: "عرض",
      submenu: [
        {
          label: "تحديث الصفحة",
          accelerator: "F5",
          click: () => mainWindow?.webContents.reload(),
        },
        {
          label: "تحديث كامل",
          accelerator: "Ctrl+Shift+R",
          click: () => mainWindow?.webContents.reloadIgnoringCache(),
        },
        { type: "separator" },
        { label: "تكبير", accelerator: "CmdOrCtrl+Plus", role: "zoomIn" },
        { label: "تصغير", accelerator: "CmdOrCtrl+-", role: "zoomOut" },
        { label: "الحجم الطبيعي", accelerator: "CmdOrCtrl+0", role: "resetZoom" },
        { type: "separator" },
        { label: "ملء الشاشة", accelerator: "F11", role: "togglefullscreen" },
        ...(isDev
          ? [
              { type: "separator" },
              {
                label: "أدوات المطور",
                accelerator: "F12",
                click: () => mainWindow?.webContents.toggleDevTools(),
              },
            ]
          : []),
      ],
    },
    {
      label: "مساعدة",
      submenu: [
        {
          label: "موقع الدعم الفني",
          click: () => shell.openExternal("https://cashierpro.replit.app"),
        },
        { type: "separator" },
        { label: "عن كاشير برو", click: showAbout },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function showAbout() {
  dialog.showMessageBox(mainWindow, {
    type: "info",
    title: "عن كاشير برو",
    message: "كاشير برو — CashierPro",
    detail:
      `الإصدار: 1.0.0\n` +
      `نظام إدارة متاجر سحابي متكامل\n\n` +
      `يعمل هذا التطبيق كواجهة مكتبية للنظام السحابي.\n` +
      `يتطلب اتصالاً بالإنترنت للعمل.`,
    buttons: ["موافق"],
    noLink: true,
  });
}

/* ─── نافذة الانتظار عند انقطاع الإنترنت ─ */
function getOfflineHTML() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>كاشير برو</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      background: linear-gradient(135deg, #0d9488 0%, #064e3b 100%);
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      color: white;
    }
    .card {
      text-align: center; padding: 60px 48px;
      background: rgba(255,255,255,0.1);
      border-radius: 28px;
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.2);
      max-width: 420px;
    }
    .icon { font-size: 80px; margin-bottom: 24px; }
    h1 { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
    p { font-size: 15px; opacity: 0.8; line-height: 1.6; margin-bottom: 32px; }
    .badge {
      background: rgba(255,255,255,0.15);
      border-radius: 12px; padding: 10px 20px;
      font-size: 13px; margin-bottom: 32px;
      border: 1px solid rgba(255,255,255,0.2);
    }
    button {
      background: white; color: #0d9488;
      border: none; border-radius: 14px;
      padding: 14px 36px; font-size: 15px;
      font-weight: 700; cursor: pointer;
      font-family: inherit;
      transition: transform 0.1s;
    }
    button:hover { transform: scale(1.03); }
    button:active { transform: scale(0.98); }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📡</div>
    <h1>كاشير برو</h1>
    <p>لا يوجد اتصال بالإنترنت.<br/>يرجى التحقق من الاتصال ثم المحاولة مجددًا.</p>
    <div class="badge">⚡ النظام يعمل بشكل طبيعي — في انتظار الإنترنت</div>
    <button onclick="location.reload()">🔄 إعادة المحاولة</button>
  </div>
</body>
</html>`;
}

/* ─── إنشاء النافذة الرئيسية ─────────── */
function createMainWindow() {
  const iconPath = (() => {
    const p = path.join(__dirname, "../build/icon.ico");
    try {
      require("fs").accessSync(p);
      return p;
    } catch {
      return undefined;
    }
  })();

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    center: true,
    title: "كاشير برو",
    ...(iconPath ? { icon: iconPath } : {}),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      partition: "persist:cashierpro",
    },
    autoHideMenuBar: false,
    show: false,
    backgroundColor: "#0f172a",
  });

  buildMenu();

  // تحميل التطبيق السحابي
  mainWindow.loadURL(APP_URL);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // إذا فشل التحميل، أظهر صفحة انقطاع الإنترنت
  mainWindow.webContents.on("did-fail-load", (_event, code, desc) => {
    if (code === -3) return; // ERR_ABORTED — ignore
    mainWindow.webContents.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(getOfflineHTML())}`
    );
  });

  // افتح الروابط الخارجية في المتصفح الافتراضي
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL)) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/* ─── دورة حياة التطبيق ──────────────── */
app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

/* ─── IPC ──────────────────────────── */
ipcMain.handle("get-app-version", () => app.getVersion());
