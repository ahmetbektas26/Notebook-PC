const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeImage,
  Notification,
  session,
  Tray
} = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

let mainWindow;
let tray;
let isQuitting = false;
const reminderTimers = new Map();

const traySvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
  <rect width="64" height="64" rx="16" fill="#171b2e"/>
  <rect x="14" y="10" width="38" height="44" rx="7" fill="#f3c969"/>
  <path d="M24 10v44M31 23h13M31 32h13M31 41h9" stroke="#171b2e" stroke-width="4" stroke-linecap="round"/>
</svg>`;

function iconFromSvg() {
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(traySvg).toString("base64")}`;
  return nativeImage.createFromDataURL(dataUrl);
}

function storageFile() {
  return path.join(app.getPath("userData"), "notebook-data.json");
}

function recordingsDir() {
  return path.join(app.getPath("userData"), "recordings");
}

async function ensureStorage() {
  await fs.mkdir(recordingsDir(), { recursive: true });
}

async function atomicWrite(filePath, text) {
  const temporary = `${filePath}.tmp`;
  await fs.writeFile(temporary, text, "utf8");
  await fs.rename(temporary, filePath);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1040,
    minHeight: 680,
    title: "Notebook-PC",
    backgroundColor: "#f5f2ea",
    icon: iconFromSvg(),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  tray = new Tray(iconFromSvg().resize({ width: 20, height: 20 }));
  tray.setToolTip("Notebook-PC");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Notebook-PC'yi aç",
        click: () => {
          mainWindow.show();
          mainWindow.focus();
        }
      },
      { type: "separator" },
      {
        label: "Çıkış",
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ])
  );
  tray.on("double-click", () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

function nextOccurrence(reminder) {
  const initial = new Date(reminder.dueAt);
  if (Number.isNaN(initial.getTime())) return null;
  const now = Date.now();
  if (initial.getTime() > now) return initial;
  if (reminder.repeat === "none") return null;

  const next = new Date(initial);
  const step = reminder.repeat === "daily" ? 1 : 7;
  while (next.getTime() <= now) next.setDate(next.getDate() + step);
  return next;
}

function scheduleReminder(reminder) {
  const due = nextOccurrence(reminder);
  if (!due || reminder.completed) return;
  const maxDelay = 2_147_000_000;
  const delay = due.getTime() - Date.now();
  const arm = () => {
    const remaining = due.getTime() - Date.now();
    if (remaining > maxDelay) {
      const timer = setTimeout(arm, maxDelay);
      reminderTimers.set(reminder.id, timer);
      return;
    }
    const timer = setTimeout(() => {
      const notification = new Notification({
        title: reminder.title,
        body: reminder.courseName
          ? `${reminder.courseName} · Notebook-PC`
          : "Notebook-PC hatırlatıcısı",
        icon: iconFromSvg()
      });
      notification.on("click", () => {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send("reminder:open", reminder.id);
      });
      notification.show();
      if (reminder.repeat !== "none") {
        scheduleReminder({ ...reminder, dueAt: due.toISOString() });
      }
    }, Math.max(0, remaining));
    reminderTimers.set(reminder.id, timer);
  };
  arm();
}

function syncReminders(reminders) {
  for (const timer of reminderTimers.values()) clearTimeout(timer);
  reminderTimers.clear();
  reminders.forEach(scheduleReminder);
}

app.whenReady().then(async () => {
  await ensureStorage();
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      callback(permission === "media");
    }
  );
  createWindow();
  createTray();
});

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
  else mainWindow.show();
});

app.on("window-all-closed", () => {
  if (process.platform === "darwin") return;
});

ipcMain.handle("data:load", async () => {
  try {
    return JSON.parse(await fs.readFile(storageFile(), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
});

ipcMain.handle("data:save", async (_event, data) => {
  await ensureStorage();
  await atomicWrite(storageFile(), JSON.stringify(data, null, 2));
  return true;
});

ipcMain.handle("data:path", () => app.getPath("userData"));

ipcMain.handle("app:launch-at-login", (_event, enabled) => {
  app.setLoginItemSettings({
    openAtLogin: Boolean(enabled),
    openAsHidden: Boolean(enabled)
  });
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle(
  "app:get-launch-at-login",
  () => app.getLoginItemSettings().openAtLogin
);

ipcMain.handle("audio:save", async (_event, arrayBuffer, mimeType) => {
  await ensureStorage();
  const extension = mimeType?.includes("ogg") ? "ogg" : "webm";
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  await fs.writeFile(
    path.join(recordingsDir(), fileName),
    Buffer.from(arrayBuffer)
  );
  return fileName;
});

ipcMain.handle("audio:read", async (_event, fileName) => {
  const safeName = path.basename(fileName);
  const bytes = await fs.readFile(path.join(recordingsDir(), safeName));
  const extension = path.extname(safeName).slice(1);
  return `data:audio/${extension};base64,${bytes.toString("base64")}`;
});

ipcMain.handle("audio:delete", async (_event, fileName) => {
  const safeName = path.basename(fileName);
  await fs.rm(path.join(recordingsDir(), safeName), { force: true });
  return true;
});

ipcMain.handle("reminders:sync", (_event, reminders) => {
  syncReminders(Array.isArray(reminders) ? reminders : []);
  return true;
});

ipcMain.handle("backup:export", async (_event, data) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Notebook-PC yedeğini kaydet",
    defaultPath: `Notebook-PC-yedek-${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: "JSON yedeği", extensions: ["json"] }]
  });
  if (result.canceled || !result.filePath) return null;
  await atomicWrite(result.filePath, JSON.stringify(data, null, 2));
  return result.filePath;
});

ipcMain.handle("backup:import", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Notebook-PC yedeğini seç",
    properties: ["openFile"],
    filters: [{ name: "JSON yedeği", extensions: ["json"] }]
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return JSON.parse(await fs.readFile(result.filePaths[0], "utf8"));
});

ipcMain.on("window:show", () => {
  mainWindow.show();
  mainWindow.focus();
});
