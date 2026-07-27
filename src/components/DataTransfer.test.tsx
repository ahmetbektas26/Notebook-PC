// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialData } from "../lib/data";
import DataTransfer from "./DataTransfer";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, "notebookAPI");
});

describe("içe ve dışa aktarma", () => {
  it("Markdown, CSV ve PDF dosyalarını tek işlemde içeri alır", async () => {
    const api = {
      importFiles: vi.fn(async () => [
        { type: "md", name: "fikir.md", content: "# Yeni fikir\n\nMetin" },
        {
          type: "csv",
          name: "plan.csv",
          content:
            '"type","id","title","details","date","time","status","tags","course","ects","grade"\n' +
            '"planner","1","Kontrol","Detay","2026-07-28","09:00","open","task","","",""'
        },
        {
          type: "pdf",
          name: "okuma.pdf",
          fileName: "stored.pdf",
          size: 2048
        }
      ])
    };
    Object.defineProperty(window, "notebookAPI", {
      configurable: true,
      value: api
    });
    const onDataChange = vi.fn();
    const onToast = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTransfer
        data={createInitialData()}
        onDataChange={onDataChange}
        onToast={onToast}
      />
    );

    await user.click(screen.getByRole("button", { name: /İçe aktar/ }));
    await waitFor(() => expect(onDataChange).toHaveBeenCalledOnce());
    const imported = onDataChange.mock.calls[0][0];
    expect(imported.notes).toHaveLength(2);
    expect(imported.notes.map((note: { title: string }) => note.title)).toEqual(
      expect.arrayContaining(["Yeni fikir", "okuma"])
    );
    expect(imported.plannerItems[0].title).toBe("Kontrol");
    expect(onToast).toHaveBeenCalledWith(
      "3 dosya Notebook-PC’ye aktarıldı."
    );
  });

  it("geçersiz JSON yedeğini reddedip mevcut veriyi değiştirmez", async () => {
    const api = {
      importFiles: vi.fn(async () => [
        { type: "json", name: "bozuk.json", content: '{"version":99}' }
      ])
    };
    Object.defineProperty(window, "notebookAPI", {
      configurable: true,
      value: api
    });
    const onDataChange = vi.fn();
    const onToast = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTransfer
        data={createInitialData()}
        onDataChange={onDataChange}
        onToast={onToast}
      />
    );

    await user.click(screen.getByRole("button", { name: /İçe aktar/ }));
    await waitFor(() =>
      expect(onToast).toHaveBeenCalledWith("Geçersiz JSON yedeği.")
    );
    expect(onDataChange).not.toHaveBeenCalled();
  });

  it("dışa aktarma disk hatasını başarılı gibi göstermez", async () => {
    const api = {
      exportBackup: vi.fn(async () => {
        throw new Error("disk full");
      })
    };
    Object.defineProperty(window, "notebookAPI", {
      configurable: true,
      value: api
    });
    const onToast = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTransfer
        data={createInitialData()}
        onDataChange={vi.fn()}
        onToast={onToast}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "JSON Tam yedek" })
    );

    expect(onToast).toHaveBeenCalledWith("JSON yedeği oluşturulamadı.");
    expect(onToast).not.toHaveBeenCalledWith("JSON yedeği oluşturuldu.");
  });
});
