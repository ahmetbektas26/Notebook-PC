// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialData } from "../lib/data";
import SecuritySettings from "./SecuritySettings";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, "notebookAPI");
});

describe("güvenlik ayarları hata davranışı", () => {
  it("kilit servisi başarısızsa açık ekranı yanlışlıkla kilitli göstermez", async () => {
    Object.defineProperty(window, "notebookAPI", {
      configurable: true,
      value: {
        lockNow: vi.fn(async () => {
          throw new Error("service error");
        }),
        setAutoLock: vi.fn()
      }
    });
    const onLock = vi.fn();
    const onToast = vi.fn();
    const user = userEvent.setup();
    render(
      <SecuritySettings
        data={createInitialData()}
        status={{ enabled: true, locked: false, autoLockMinutes: 5 }}
        onStatusChange={vi.fn()}
        onLock={onLock}
        onToast={onToast}
      />
    );

    await user.click(screen.getByRole("button", { name: "Şimdi kilitle" }));

    expect(onLock).not.toHaveBeenCalled();
    expect(onToast).toHaveBeenCalledWith("Uygulama kilitlenemedi.");
  });

  it("otomatik kilit kaydı başarısızsa eski durumu korur", async () => {
    Object.defineProperty(window, "notebookAPI", {
      configurable: true,
      value: {
        lockNow: vi.fn(),
        setAutoLock: vi.fn(async () => {
          throw new Error("disk error");
        })
      }
    });
    const onStatusChange = vi.fn();
    const onToast = vi.fn();
    const user = userEvent.setup();
    render(
      <SecuritySettings
        data={createInitialData()}
        status={{ enabled: true, locked: false, autoLockMinutes: 5 }}
        onStatusChange={onStatusChange}
        onLock={vi.fn()}
        onToast={onToast}
      />
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Otomatik kilitle" }),
      "15"
    );

    expect(onStatusChange).not.toHaveBeenCalled();
    expect(onToast).toHaveBeenCalledWith(
      "Otomatik kilit süresi kaydedilemedi."
    );
  });
});
