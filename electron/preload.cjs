const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("notebookAPI", {
  loadData: () => ipcRenderer.invoke("data:load"),
  saveData: (data) => ipcRenderer.invoke("data:save", data),
  saveAudio: (bytes, mimeType) =>
    ipcRenderer.invoke("audio:save", bytes, mimeType),
  readAudio: (fileName) => ipcRenderer.invoke("audio:read", fileName),
  deleteAudio: (fileName) => ipcRenderer.invoke("audio:delete", fileName),
  syncReminders: (reminders) =>
    ipcRenderer.invoke("reminders:sync", reminders),
  exportBackup: (data) => ipcRenderer.invoke("backup:export", data),
  importBackup: () => ipcRenderer.invoke("backup:import"),
  getStoragePath: () => ipcRenderer.invoke("data:path"),
  setLaunchAtLogin: (enabled) =>
    ipcRenderer.invoke("app:launch-at-login", enabled),
  getLaunchAtLogin: () => ipcRenderer.invoke("app:get-launch-at-login"),
  showWindow: () => ipcRenderer.send("window:show"),
  onReminderOpen: (callback) => {
    const listener = (_event, reminderId) => callback(reminderId);
    ipcRenderer.on("reminder:open", listener);
    return () => ipcRenderer.removeListener("reminder:open", listener);
  }
});
