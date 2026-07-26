import type { AppData, ReminderForSystem } from "./types";

declare global {
  interface Window {
    notebookAPI?: {
      loadData: () => Promise<AppData | null>;
      saveData: (data: AppData) => Promise<boolean>;
      saveAudio: (bytes: ArrayBuffer, mimeType: string) => Promise<string>;
      readAudio: (fileName: string) => Promise<string>;
      deleteAudio: (fileName: string) => Promise<boolean>;
      saveAttachment: (
        bytes: ArrayBuffer,
        originalName: string,
        mimeType: string
      ) => Promise<string>;
      openAttachment: (fileName: string) => Promise<boolean>;
      deleteAttachment: (fileName: string) => Promise<boolean>;
      syncReminders: (reminders: ReminderForSystem[]) => Promise<boolean>;
      exportBackup: (data: AppData) => Promise<string | null>;
      importBackup: () => Promise<AppData | null>;
      getStoragePath: () => Promise<string>;
      setLaunchAtLogin: (enabled: boolean) => Promise<boolean>;
      getLaunchAtLogin: () => Promise<boolean>;
      showWindow: () => void;
      onReminderOpen: (callback: (reminderId: string) => void) => () => void;
    };
  }
}

export {};
