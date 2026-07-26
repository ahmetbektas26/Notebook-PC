const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeImage,
  Notification,
  session,
  shell,
  Tray
} = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

let mainWindow;
let tray;
let isQuitting = false;
let encryptionKey = null;
const reminderTimers = new Map();
const startHidden = process.argv.includes("--hidden");
const ENCRYPTION_MAGIC = Buffer.from("NBPCENC1");

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

function encryptedStorageFile() {
  return path.join(app.getPath("userData"), "notebook-data.enc");
}

function securityFile() {
  return path.join(app.getPath("userData"), "security.json");
}

function recordingsDir() {
  return path.join(app.getPath("userData"), "recordings");
}

function attachmentsDir() {
  return path.join(app.getPath("userData"), "attachments");
}

function openedAttachmentsDir() {
  return path.join(app.getPath("temp"), "Notebook-PC-opened-pdfs");
}

async function ensureStorage() {
  await fs.mkdir(recordingsDir(), { recursive: true });
  await fs.mkdir(attachmentsDir(), { recursive: true });
  await fs.mkdir(openedAttachmentsDir(), { recursive: true });
}

async function atomicWrite(filePath, text) {
  const temporary = `${filePath}.tmp`;
  await fs.writeFile(temporary, text, "utf8");
  await fs.rename(temporary, filePath);
}

async function atomicWriteBuffer(filePath, bytes) {
  const temporary = `${filePath}.tmp`;
  await fs.writeFile(temporary, bytes);
  await fs.rename(temporary, filePath);
}

async function readSecurityConfig() {
  try {
    return JSON.parse(await fs.readFile(securityFile(), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function deriveKey(passcode, salt) {
  return crypto.scryptSync(String(passcode), salt, 32);
}

function encryptBuffer(bytes, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(bytes), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([ENCRYPTION_MAGIC, iv, tag, encrypted]);
}

function decryptBuffer(bytes, key) {
  if (!bytes.subarray(0, ENCRYPTION_MAGIC.length).equals(ENCRYPTION_MAGIC)) {
    return bytes;
  }
  const ivStart = ENCRYPTION_MAGIC.length;
  const tagStart = ivStart + 12;
  const contentStart = tagStart + 16;
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    bytes.subarray(ivStart, tagStart)
  );
  decipher.setAuthTag(bytes.subarray(tagStart, contentStart));
  return Buffer.concat([
    decipher.update(bytes.subarray(contentStart)),
    decipher.final()
  ]);
}

async function readStoredData(key = encryptionKey) {
  const config = await readSecurityConfig();
  if (config) {
    if (!key) throw new Error("LOCKED");
    const bytes = await fs.readFile(encryptedStorageFile());
    return JSON.parse(decryptBuffer(bytes, key).toString("utf8"));
  }
  return JSON.parse(await fs.readFile(storageFile(), "utf8"));
}

async function saveStoredData(data) {
  const config = await readSecurityConfig();
  if (config) {
    if (!encryptionKey) throw new Error("LOCKED");
    await atomicWriteBuffer(
      encryptedStorageFile(),
      encryptBuffer(Buffer.from(JSON.stringify(data)), encryptionKey)
    );
    await fs.rm(storageFile(), { force: true });
    return;
  }
  await atomicWrite(storageFile(), JSON.stringify(data, null, 2));
}

async function transformDirectory(directory, key, encrypt) {
  let names = [];
  try {
    names = await fs.readdir(directory);
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  for (const name of names) {
    const filePath = path.join(directory, path.basename(name));
    const bytes = await fs.readFile(filePath);
    const isEncrypted = bytes
      .subarray(0, ENCRYPTION_MAGIC.length)
      .equals(ENCRYPTION_MAGIC);
    if (encrypt && !isEncrypted) {
      await atomicWriteBuffer(filePath, encryptBuffer(bytes, key));
    }
    if (!encrypt && isEncrypted) {
      await atomicWriteBuffer(filePath, decryptBuffer(bytes, key));
    }
  }
}

async function readProtectedFile(filePath) {
  const bytes = await fs.readFile(filePath);
  const config = await readSecurityConfig();
  if (!config) return bytes;
  if (!encryptionKey) throw new Error("LOCKED");
  return decryptBuffer(bytes, encryptionKey);
}

async function writeProtectedFile(filePath, bytes) {
  const config = await readSecurityConfig();
  if (!config) {
    await fs.writeFile(filePath, bytes);
    return;
  }
  if (!encryptionKey) throw new Error("LOCKED");
  await fs.writeFile(filePath, encryptBuffer(bytes, encryptionKey));
}

async function lockApplication() {
  const config = await readSecurityConfig();
  if (!config) return;
  encryptionKey = null;
  await fs.rm(openedAttachmentsDir(), { recursive: true, force: true });
  await fs.mkdir(openedAttachmentsDir(), { recursive: true });
  mainWindow?.webContents.send("security:locked");
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

  mainWindow.once("ready-to-show", () => {
    if (!startHidden) mainWindow.show();
  });
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      lockApplication().catch(() => undefined);
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
  await fs.rm(openedAttachmentsDir(), { recursive: true, force: true });
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
    return await readStoredData();
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
});

ipcMain.handle("data:save", async (_event, data) => {
  await ensureStorage();
  await saveStoredData(data);
  return true;
});

ipcMain.handle("data:path", () => app.getPath("userData"));

ipcMain.handle("security:status", async () => {
  const config = await readSecurityConfig();
  return {
    enabled: Boolean(config),
    locked: Boolean(config) && !encryptionKey,
    autoLockMinutes: config?.autoLockMinutes ?? 0
  };
});

ipcMain.handle("security:unlock", async (_event, passcode) => {
  const config = await readSecurityConfig();
  if (!config) return { data: await readStoredData(), status: null };
  try {
    const key = deriveKey(passcode, Buffer.from(config.salt, "base64"));
    const data = await readStoredData(key);
    encryptionKey = key;
    return {
      data,
      status: {
        enabled: true,
        locked: false,
        autoLockMinutes: config.autoLockMinutes ?? 0
      }
    };
  } catch {
    throw new Error("Şifre yanlış veya şifreli veri okunamıyor.");
  }
});

ipcMain.handle(
  "security:enable",
  async (_event, passcode, data, autoLockMinutes) => {
    if (String(passcode).length < 6) {
      throw new Error("Şifre en az 6 karakter olmalı.");
    }
    const salt = crypto.randomBytes(16);
    const key = deriveKey(passcode, salt);
    const config = {
      version: 1,
      salt: salt.toString("base64"),
      autoLockMinutes: Number(autoLockMinutes) || 0
    };
    encryptionKey = key;
    await atomicWrite(securityFile(), JSON.stringify(config, null, 2));
    await atomicWriteBuffer(
      encryptedStorageFile(),
      encryptBuffer(Buffer.from(JSON.stringify(data)), key)
    );
    await fs.rm(storageFile(), { force: true });
    await transformDirectory(recordingsDir(), key, true);
    await transformDirectory(attachmentsDir(), key, true);
    return {
      enabled: true,
      locked: false,
      autoLockMinutes: config.autoLockMinutes
    };
  }
);

ipcMain.handle("security:disable", async (_event, passcode, data) => {
  const config = await readSecurityConfig();
  if (!config) {
    return { enabled: false, locked: false, autoLockMinutes: 0 };
  }
  try {
    const key = deriveKey(passcode, Buffer.from(config.salt, "base64"));
    await readStoredData(key);
    await transformDirectory(recordingsDir(), key, false);
    await transformDirectory(attachmentsDir(), key, false);
    await atomicWrite(storageFile(), JSON.stringify(data, null, 2));
    await fs.rm(encryptedStorageFile(), { force: true });
    await fs.rm(securityFile(), { force: true });
    encryptionKey = null;
    return { enabled: false, locked: false, autoLockMinutes: 0 };
  } catch {
    throw new Error("Şifre yanlış.");
  }
});

ipcMain.handle("security:set-auto-lock", async (_event, minutes) => {
  const config = await readSecurityConfig();
  if (!config) return null;
  config.autoLockMinutes = Math.max(0, Number(minutes) || 0);
  await atomicWrite(securityFile(), JSON.stringify(config, null, 2));
  return {
    enabled: true,
    locked: !encryptionKey,
    autoLockMinutes: config.autoLockMinutes
  };
});

ipcMain.handle("security:lock", async () => {
  await lockApplication();
  return true;
});

ipcMain.handle("app:launch-at-login", (_event, enabled) => {
  app.setLoginItemSettings({
    openAtLogin: Boolean(enabled),
    path: app.getPath("exe"),
    args: enabled ? ["--hidden"] : []
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
  await writeProtectedFile(
    path.join(recordingsDir(), fileName),
    Buffer.from(arrayBuffer)
  );
  return fileName;
});

ipcMain.handle("audio:read", async (_event, fileName) => {
  const safeName = path.basename(fileName);
  const bytes = await readProtectedFile(path.join(recordingsDir(), safeName));
  const extension = path.extname(safeName).slice(1);
  return `data:audio/${extension};base64,${bytes.toString("base64")}`;
});

ipcMain.handle("audio:delete", async (_event, fileName) => {
  const safeName = path.basename(fileName);
  await fs.rm(path.join(recordingsDir(), safeName), { force: true });
  return true;
});

ipcMain.handle(
  "attachment:save",
  async (_event, arrayBuffer, originalName, mimeType) => {
    await ensureStorage();
    const isPdf =
      mimeType === "application/pdf" ||
      path.extname(String(originalName)).toLowerCase() === ".pdf";
    if (!isPdf) throw new Error("Yalnızca PDF dosyaları destekleniyor.");
    const bytes = Buffer.from(arrayBuffer);
    if (bytes.length > 50 * 1024 * 1024) {
      throw new Error("PDF dosyası 50 MB sınırını aşıyor.");
    }
    const fileName = `${Date.now()}-${crypto.randomUUID()}.pdf`;
    await writeProtectedFile(path.join(attachmentsDir(), fileName), bytes);
    return fileName;
  }
);

ipcMain.handle("attachment:open", async (_event, fileName) => {
  const safeName = path.basename(fileName);
  const source = path.join(attachmentsDir(), safeName);
  const bytes = await readProtectedFile(source);
  const target = path.join(openedAttachmentsDir(), safeName);
  await atomicWriteBuffer(target, bytes);
  const error = await shell.openPath(target);
  if (error) throw new Error(error);
  return true;
});

ipcMain.handle("attachment:read", async (_event, fileName) => {
  const safeName = path.basename(fileName);
  const bytes = await readProtectedFile(path.join(attachmentsDir(), safeName));
  return `data:application/pdf;base64,${bytes.toString("base64")}`;
});

ipcMain.handle("attachment:delete", async (_event, fileName) => {
  const safeName = path.basename(fileName);
  await fs.rm(path.join(attachmentsDir(), safeName), { force: true });
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

ipcMain.handle(
  "transfer:export-text",
  async (_event, content, extension, suggestedName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: "Notebook-PC dışa aktarımı",
      defaultPath: suggestedName,
      filters: [
        {
          name: extension.toUpperCase(),
          extensions: [extension]
        }
      ]
    });
    if (result.canceled || !result.filePath) return null;
    await atomicWrite(result.filePath, String(content));
    return result.filePath;
  }
);

ipcMain.handle(
  "transfer:export-pdf",
  async (_event, html, suggestedName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: "Notebook-PC PDF dışa aktarımı",
      defaultPath: suggestedName,
      filters: [{ name: "PDF", extensions: ["pdf"] }]
    });
    if (result.canceled || !result.filePath) return null;
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: { sandbox: true }
    });
    try {
      const encoded = Buffer.from(String(html)).toString("base64");
      await printWindow.loadURL(`data:text/html;base64,${encoded}`);
      const bytes = await printWindow.webContents.printToPDF({
        printBackground: true,
        pageSize: "A4"
      });
      await fs.writeFile(result.filePath, bytes);
      return result.filePath;
    } finally {
      printWindow.destroy();
    }
  }
);

ipcMain.handle("transfer:import-files", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Notebook-PC'ye aktar",
    properties: ["openFile", "multiSelections"],
    filters: [
      {
        name: "Desteklenen dosyalar",
        extensions: ["json", "md", "markdown", "csv", "pdf"]
      }
    ]
  });
  if (result.canceled) return [];
  const imported = [];
  for (const filePath of result.filePaths) {
    const extension = path.extname(filePath).slice(1).toLowerCase();
    const name = path.basename(filePath);
    if (extension === "pdf") {
      const bytes = await fs.readFile(filePath);
      if (bytes.length > 50 * 1024 * 1024) {
        throw new Error(`${name} 50 MB sınırını aşıyor.`);
      }
      const storedName = `${Date.now()}-${crypto.randomUUID()}.pdf`;
      await writeProtectedFile(path.join(attachmentsDir(), storedName), bytes);
      imported.push({
        type: "pdf",
        name,
        fileName: storedName,
        size: bytes.length
      });
    } else {
      imported.push({
        type: extension === "markdown" ? "md" : extension,
        name,
        content: await fs.readFile(filePath, "utf8")
      });
    }
  }
  return imported;
});

ipcMain.on("window:show", () => {
  mainWindow.show();
  mainWindow.focus();
});
