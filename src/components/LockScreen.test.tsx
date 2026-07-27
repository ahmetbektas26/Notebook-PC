// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialData } from "../lib/data";
import type { SecurityStatus } from "../types";
import LockScreen from "./LockScreen";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, "notebookAPI");
});

function installUnlockMock(
  unlock: (passcode: string) => Promise<{
    data: ReturnType<typeof createInitialData>;
    status: SecurityStatus;
  }>
) {
  Object.defineProperty(window, "notebookAPI", {
    configurable: true,
    value: { unlock }
  });
}

describe("kilit ekranı", () => {
  it("klavyeden şifre yazmayı, görünürlük düğmesini ve Enter ile açmayı destekler", async () => {
    const data = createInitialData();
    const status: SecurityStatus = {
      enabled: true,
      locked: false,
      autoLockMinutes: 5
    };
    const unlock = vi.fn(async () => ({ data, status }));
    const onUnlock = vi.fn();
    installUnlockMock(unlock);
    const user = userEvent.setup();

    render(<LockScreen onUnlock={onUnlock} />);
    const input = screen.getByLabelText("Uygulama şifresi");

    expect(document.activeElement).toBe(input);
    await user.type(input, "güvenli-şifre");
    expect((input as HTMLInputElement).value).toBe("güvenli-şifre");
    expect(screen.getByText("13 karakter yazıldı")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Şifreyi göster" }));
    expect(input.getAttribute("type")).toBe("text");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(unlock).toHaveBeenCalledWith("güvenli-şifre"));
    expect(onUnlock).toHaveBeenCalledWith(data, status);
  });

  it("boş gönderimi açıklar; yanlış şifreden sonra alanı temizleyip odaklar", async () => {
    const unlock = vi.fn(async () => {
      throw new Error("wrong password");
    });
    installUnlockMock(unlock);
    const user = userEvent.setup();

    render(<LockScreen onUnlock={vi.fn()} />);
    const input = screen.getByLabelText("Uygulama şifresi");
    await user.click(screen.getByRole("button", { name: "Kasayı aç" }));
    expect(screen.getByRole("alert").textContent).toContain(
      "Devam etmek için şifreni yaz."
    );
    expect(unlock).not.toHaveBeenCalled();

    await user.type(input, "yanlış");
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain("Şifre yanlış")
    );
    expect((input as HTMLInputElement).value).toBe("");
    expect(document.activeElement).toBe(input);
  });
});
