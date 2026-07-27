// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { createInitialData } from "./lib/data";
import type { AppData, SecurityStatus } from "./types";

function createDesktopApi(
  data: AppData,
  status: SecurityStatus = {
    enabled: false,
    locked: false,
    autoLockMinutes: 0
  }
) {
  return {
    loadData: vi.fn(async () => data),
    saveData: vi.fn(async () => true),
    saveAudio: vi.fn(async () => "audio.webm"),
    readAudio: vi.fn(async () => "data:audio/webm;base64,"),
    deleteAudio: vi.fn(async () => true),
    saveAttachment: vi.fn(async () => "attachment.pdf"),
    openAttachment: vi.fn(async () => true),
    readAttachment: vi.fn(async () => "data:application/pdf;base64,"),
    deleteAttachment: vi.fn(async () => true),
    syncReminders: vi.fn(async () => true),
    exportBackup: vi.fn(async () => null),
    importBackup: vi.fn(async () => null),
    exportText: vi.fn(async () => null),
    exportPdf: vi.fn(async () => null),
    importFiles: vi.fn(async () => []),
    getSecurityStatus: vi.fn(async () => status),
    unlock: vi.fn(async () => ({
      data,
      status: { ...status, locked: false }
    })),
    enableSecurity: vi.fn(async () => ({
      enabled: true,
      locked: false,
      autoLockMinutes: 5
    })),
    disableSecurity: vi.fn(async () => ({
      enabled: false,
      locked: false,
      autoLockMinutes: 0
    })),
    setAutoLock: vi.fn(async (minutes: number) => ({
      enabled: true,
      locked: false,
      autoLockMinutes: minutes
    })),
    lockNow: vi.fn(async () => true),
    getStoragePath: vi.fn(async () => "C:\\Notebook-PC"),
    setLaunchAtLogin: vi.fn(async (enabled: boolean) => enabled),
    getLaunchAtLogin: vi.fn(async () => false),
    showWindow: vi.fn(),
    onReminderOpen: vi.fn(() => () => undefined),
    onSecurityLocked: vi.fn(() => () => undefined)
  };
}

beforeEach(() => {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: { randomUUID: vi.fn(() => `test-${Math.random()}`) }
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn()
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, "notebookAPI");
});

describe("Notebook-PC ana uygulama", () => {
  it("kilitsiz açılır ve bütün ana modüller arasında hatasız gezinir", async () => {
    const api = createDesktopApi(createInitialData());
    Object.defineProperty(window, "notebookAPI", {
      configurable: true,
      value: api
    });
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("Bugün yapacakların")).toBeTruthy();
    const destinations = [
      ["Takvim", "Planla, not al, ilerle"],
      ["Haftalık bakış", "Haftalık değerlendirme"],
      ["Kişisel hedefler", "Büyük hedefleri görünür kıl"],
      ["Not defteri", "KİŞİSEL ALAN"],
      ["Şablonlar", "Not şablonları"],
      ["Okul", "AYRI BİR ÇALIŞMA ALANI"],
      ["Ayarlar", "Ayarlar ve yedekleme"],
      ["Bugün", "Bugün yapacakların"]
    ];

    for (const [menu, marker] of destinations) {
      await user.click(screen.getByRole("button", { name: menu }));
      expect(await screen.findByText(marker, { exact: false })).toBeTruthy();
    }

    expect(api.getSecurityStatus).toHaveBeenCalledOnce();
    expect(api.loadData).toHaveBeenCalledOnce();
  });

  it("yerel veri servisi açılamazsa sonsuz yükleme yerine kurtarma ekranı gösterir", async () => {
    const api = createDesktopApi(createInitialData());
    api.getSecurityStatus.mockRejectedValueOnce(new Error("disk error"));
    Object.defineProperty(window, "notebookAPI", {
      configurable: true,
      value: api
    });
    render(<App />);

    expect(
      await screen.findByText("Notebook-PC başlatılamadı")
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Yeniden dene" })).toBeTruthy();
  });

  it("günlük plan, hedef, kişisel not, ders, not ortalaması ve kasa kurulumunu çalıştırır", async () => {
    const api = createDesktopApi(createInitialData());
    Object.defineProperty(window, "notebookAPI", {
      configurable: true,
      value: api
    });
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Bugün yapacakların");

    await user.type(
      screen.getByPlaceholderText(
        "Bugüne hızlıca bir görev, plan, not veya hedef ekle…"
      ),
      "Günlük kontrol"
    );
    await user.click(screen.getByRole("button", { name: "Ekle" }));
    expect(await screen.findByText("Günlük kontrol")).toBeTruthy();

    await user.click(
      screen.getByRole("button", { name: "Kişisel hedefler" })
    );
    await user.click(screen.getByRole("button", { name: "Yeni hedef" }));
    await user.type(
      screen.getByPlaceholderText("Hedef başlığı"),
      "Sağlıklı rutin"
    );
    await user.click(screen.getByRole("button", { name: "Hedefi oluştur" }));
    expect(await screen.findByText("Sağlıklı rutin")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Not defteri" }));
    await user.click(screen.getByRole("button", { name: "Not ekle" }));
    await user.click(screen.getByRole("button", { name: /Boş not/ }));
    const title = screen.getByPlaceholderText("Not başlığı");
    await user.clear(title);
    await user.type(title, "Kişisel deneme notu");
    expect(title).toHaveProperty("value", "Kişisel deneme notu");
    expect(screen.getByRole("button", { name: "PDF ekle" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Okul" }));
    await user.click(screen.getByRole("button", { name: "Ders ekle" }));
    await user.type(
      screen.getByPlaceholderText("Örn. Operating Systems"),
      "Test Dersi"
    );
    await user.type(screen.getByPlaceholderText("Örn. COME 304"), "TEST 101");
    await user.click(screen.getByRole("button", { name: "Dersi ekle" }));
    expect(await screen.findByRole("button", { name: "TEST 101" })).toBeTruthy();

    await user.click(
      screen.getByRole("button", { name: "Not ortalaması" })
    );
    await user.click(screen.getByRole("button", { name: "Ders ekle" }));
    const gradeCourse = screen.getByPlaceholderText("Ders adı / kodu");
    await user.type(gradeCourse, "Test Dersi");
    expect(gradeCourse).toHaveProperty("value", "Test Dersi");

    await user.click(screen.getByRole("button", { name: "Ayarlar" }));
    await user.type(screen.getByPlaceholderText("En az 6 karakter"), "123456");
    await user.type(screen.getByPlaceholderText("Aynı şifre"), "123456");
    await user.click(
      screen.getByRole("button", { name: "Yerel kasayı aç" })
    );
    await waitFor(() =>
      expect(api.enableSecurity).toHaveBeenCalledWith(
        "123456",
        expect.objectContaining({
          goals: expect.arrayContaining([
            expect.objectContaining({ title: "Sağlıklı rutin" })
          ]),
          courses: expect.arrayContaining([
            expect.objectContaining({ code: "TEST 101" })
          ]),
          grades: expect.arrayContaining([
            expect.objectContaining({ course: "Test Dersi" })
          ])
        }),
        5
      )
    );
    expect(await screen.findByText("KORUNUYOR")).toBeTruthy();
  });
});
