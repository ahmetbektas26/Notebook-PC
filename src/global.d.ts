import type {
  AppData,
  ReminderForSystem,
  SecurityStatus
} from "./types";

declare module "*.mjs?url" {
  const source: string;
  export default source;
}

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
      readAttachment: (fileName: string) => Promise<string>;
      deleteAttachment: (fileName: string) => Promise<boolean>;
      syncReminders: (reminders: ReminderForSystem[]) => Promise<boolean>;
      exportBackup: (data: AppData) => Promise<string | null>;
      importBackup: () => Promise<AppData | null>;
      exportText: (
        content: string,
        extension: "md" | "csv",
        suggestedName: string
      ) => Promise<string | null>;
      exportPdf: (html: string, suggestedName: string) => Promise<string | null>;
      importFiles: () => Promise<
        Array<
          | { type: "json" | "md" | "csv"; name: string; content: string }
          | {
              type: "pdf";
              name: string;
              fileName: string;
              size: number;
            }
        >
      >;
      getSecurityStatus: () => Promise<SecurityStatus>;
      unlock: (
        passcode: string
      ) => Promise<{ data: AppData; status: SecurityStatus }>;
      enableSecurity: (
        passcode: string,
        data: AppData,
        autoLockMinutes: number
      ) => Promise<SecurityStatus>;
      disableSecurity: (
        passcode: string,
        data: AppData
      ) => Promise<SecurityStatus>;
      setAutoLock: (minutes: number) => Promise<SecurityStatus | null>;
      lockNow: () => Promise<boolean>;
      getStoragePath: () => Promise<string>;
      setLaunchAtLogin: (enabled: boolean) => Promise<boolean>;
      getLaunchAtLogin: () => Promise<boolean>;
      showWindow: () => void;
      onReminderOpen: (callback: (reminderId: string) => void) => () => void;
      onSecurityLocked: (callback: () => void) => () => void;
    };
  }
}

export {};
