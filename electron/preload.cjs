const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("notebookAPI", {
  loadData: () => ipcRenderer.invoke("data:load"),
  saveData: (data) => ipcRenderer.invoke("data:save", data),
  saveAudio: (bytes, mimeType) =>
    ipcRenderer.invoke("audio:save", bytes, mimeType),
  readAudio: (fileName) => ipcRenderer.invoke("audio:read", fileName),
  deleteAudio: (fileName) => ipcRenderer.invoke("audio:delete", fileName),
  saveAttachment: (bytes, originalName, mimeType) =>
    ipcRenderer.invoke("attachment:save", bytes, originalName, mimeType),
  openAttachment: (fileName) =>
    ipcRenderer.invoke("attachment:open", fileName),
  readAttachment: (fileName) =>
    ipcRenderer.invoke("attachment:read", fileName),
  deleteAttachment: (fileName) =>
    ipcRenderer.invoke("attachment:delete", fileName),
  syncReminders: (reminders) =>
    ipcRenderer.invoke("reminders:sync", reminders),
  exportBackup: (data) => ipcRenderer.invoke("backup:export", data),
  importBackup: () => ipcRenderer.invoke("backup:import"),
  exportText: (content, extension, suggestedName) =>
    ipcRenderer.invoke(
      "transfer:export-text",
      content,
      extension,
      suggestedName
    ),
  exportPdf: (html, suggestedName) =>
    ipcRenderer.invoke("transfer:export-pdf", html, suggestedName),
  importFiles: () => ipcRenderer.invoke("transfer:import-files"),
  getSecurityStatus: () => ipcRenderer.invoke("security:status"),
  unlock: (passcode) => ipcRenderer.invoke("security:unlock", passcode),
  enableSecurity: (passcode, data, autoLockMinutes) =>
    ipcRenderer.invoke(
      "security:enable",
      passcode,
      data,
      autoLockMinutes
    ),
  disableSecurity: (passcode, data) =>
    ipcRenderer.invoke("security:disable", passcode, data),
  setAutoLock: (minutes) =>
    ipcRenderer.invoke("security:set-auto-lock", minutes),
  lockNow: () => ipcRenderer.invoke("security:lock"),
  getStoragePath: () => ipcRenderer.invoke("data:path"),
  setLaunchAtLogin: (enabled) =>
    ipcRenderer.invoke("app:launch-at-login", enabled),
  getLaunchAtLogin: () => ipcRenderer.invoke("app:get-launch-at-login"),
  showWindow: () => ipcRenderer.send("window:show"),
  onReminderOpen: (callback) => {
    const listener = (_event, reminderId) => callback(reminderId);
    ipcRenderer.on("reminder:open", listener);
    return () => ipcRenderer.removeListener("reminder:open", listener);
  },
  onSecurityLocked: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("security:locked", listener);
    return () => ipcRenderer.removeListener("security:locked", listener);
  }
});
