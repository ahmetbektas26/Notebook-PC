// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PdfAttachment } from "../types";
import PdfAttachments from "./PdfAttachments";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, "notebookAPI");
});

function installApi(overrides: Record<string, unknown> = {}) {
  const api = {
    saveAttachment: vi.fn(async () => "stored.pdf"),
    deleteAttachment: vi.fn(async () => true),
    openAttachment: vi.fn(async () => true),
    ...overrides
  };
  Object.defineProperty(window, "notebookAPI", {
    configurable: true,
    value: api
  });
  return api;
}

describe("PDF ekleri", () => {
  it("PDF seçimini masaüstü depolamasına kaydedip nota ekler", async () => {
    const api = installApi();
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <PdfAttachments attachments={[]} onChange={onChange} />
    );
    const input = container.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new Error("file input yok");
    const pdf = new File(["%PDF-1.7 test"], "makale.pdf", {
      type: "application/pdf"
    });
    Object.defineProperty(pdf, "arrayBuffer", {
      value: async () => new TextEncoder().encode("%PDF-1.7 test").buffer
    });

    await user.upload(input, pdf);
    await waitFor(() => expect(api.saveAttachment).toHaveBeenCalledOnce());
    const [bytes, originalName, mimeType] = api.saveAttachment.mock
      .calls[0] as unknown as [ArrayBuffer, string, string];
    expect(bytes).toHaveProperty("byteLength");
    expect(originalName).toBe("makale.pdf");
    expect(mimeType).toBe("application/pdf");
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        fileName: "stored.pdf",
        originalName: "makale.pdf",
        annotations: []
      })
    ]);
  });

  it("PDF olmayan ve 50 MB üstündeki dosyaları reddeder", async () => {
    const api = installApi();
    const { container } = render(
      <PdfAttachments attachments={[]} onChange={vi.fn()} />
    );
    const input = container.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new Error("file input yok");

    fireEvent.change(input, {
      target: {
        files: [new File(["metin"], "not.txt", { type: "text/plain" })]
      }
    });
    expect(
      await screen.findByText("Yalnızca PDF dosyaları ekleyebilirsin.")
    ).toBeTruthy();

    const largePdf = new File(["%PDF"], "buyuk.pdf", {
      type: "application/pdf"
    });
    Object.defineProperty(largePdf, "size", { value: 51 * 1024 * 1024 });
    fireEvent.change(input, { target: { files: [largePdf] } });
    expect(await screen.findByText("Her PDF en fazla 50 MB olabilir.")).toBeTruthy();
    expect(api.saveAttachment).not.toHaveBeenCalled();
  });

  it("eki hem diskten hem nottan siler", async () => {
    const attachment: PdfAttachment = {
      id: "pdf-1",
      fileName: "stored.pdf",
      originalName: "makale.pdf",
      size: 1024,
      createdAt: "2026-07-27T10:00:00Z",
      annotations: []
    };
    const api = installApi();
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PdfAttachments attachments={[attachment]} onChange={onChange} />
    );

    await user.click(screen.getByRole("button", { name: "PDF'yi sil" }));
    await waitFor(() =>
      expect(api.deleteAttachment).toHaveBeenCalledWith("stored.pdf")
    );
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("diskten silinemeyen PDF'yi nottan kaldırıp kaybettirmez", async () => {
    const attachment: PdfAttachment = {
      id: "pdf-1",
      fileName: "stored.pdf",
      originalName: "makale.pdf",
      size: 1024,
      createdAt: "2026-07-27T10:00:00Z",
      annotations: []
    };
    installApi({
      deleteAttachment: vi.fn(async () => {
        throw new Error("file in use");
      })
    });
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PdfAttachments attachments={[attachment]} onChange={onChange} />
    );

    await user.click(screen.getByRole("button", { name: "PDF'yi sil" }));

    expect(
      await screen.findByText("PDF silinemedi. Dosya kullanımda olabilir.")
    ).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
  });
});
