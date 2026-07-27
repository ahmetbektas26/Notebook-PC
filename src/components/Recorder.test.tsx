// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AudioNote } from "../types";
import Recorder from "./Recorder";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, "notebookAPI");
});

describe("sesli notlar", () => {
  it("mikrofon erişimi yoksa kullanıcıya anlaşılır hata gösterir", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn(async () => {
          throw new Error("permission denied");
        })
      }
    });
    const user = userEvent.setup();
    render(<Recorder recordings={[]} onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Ses kaydı ekle" }));
    expect(
      await screen.findByText(
        "Mikrofon izni verilemedi. Sistem ayarlarından izni kontrol et."
      )
    ).toBeTruthy();
  });

  it("kayıt dosyasını yükler ve siler", async () => {
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn()
    });
    const api = {
      readAudio: vi.fn(async () => "data:audio/webm;base64,dGVzdA=="),
      deleteAudio: vi.fn(async () => true)
    };
    Object.defineProperty(window, "notebookAPI", {
      configurable: true,
      value: api
    });
    const recording: AudioNote = {
      id: "audio-1",
      fileName: "audio.webm",
      duration: 12,
      createdAt: "2026-07-27T10:00:00Z"
    };
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <Recorder recordings={[recording]} onChange={onChange} />
    );

    await user.click(screen.getByRole("button", { name: "Kaydı yükle" }));
    await waitFor(() =>
      expect(api.readAudio).toHaveBeenCalledWith("audio.webm")
    );
    expect(container.querySelector("audio")?.getAttribute("src")).toContain(
      "data:audio/webm"
    );

    await user.click(screen.getByRole("button", { name: "Ses kaydını sil" }));
    await waitFor(() =>
      expect(api.deleteAudio).toHaveBeenCalledWith("audio.webm")
    );
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("yeni bir ses yüklenince önceki oynatma adresini erkenden bozmaz", async () => {
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL
    });
    const api = {
      readAudio: vi.fn(async (fileName: string) => `blob:${fileName}`),
      deleteAudio: vi.fn(async () => true)
    };
    Object.defineProperty(window, "notebookAPI", {
      configurable: true,
      value: api
    });
    const recordings: AudioNote[] = ["one.webm", "two.webm"].map(
      (fileName, index) => ({
        id: `${index}`,
        fileName,
        duration: 10,
        createdAt: "2026-07-27T10:00:00Z"
      })
    );
    const user = userEvent.setup();
    render(<Recorder recordings={recordings} onChange={vi.fn()} />);

    await user.click(screen.getAllByRole("button", { name: "Kaydı yükle" })[0]);
    await waitFor(() => expect(api.readAudio).toHaveBeenCalledWith("one.webm"));
    await user.click(screen.getAllByRole("button", { name: "Kaydı yükle" })[1]);
    await waitFor(() => expect(api.readAudio).toHaveBeenCalledWith("two.webm"));

    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it("disk kaydı başarısız olsa bile mikrofonu açık bırakmaz", async () => {
    const stopTrack = vi.fn();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn(async () => ({
          getTracks: () => [{ stop: stopTrack }]
        }))
      }
    });
    class FakeMediaRecorder {
      static isTypeSupported() {
        return true;
      }

      mimeType = "audio/webm";
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;

      constructor(_stream: MediaStream, _options?: MediaRecorderOptions) {}
      start() {}
      stop() {
        const blob = new Blob(["audio"], { type: this.mimeType });
        if (typeof blob.arrayBuffer !== "function") {
          Object.defineProperty(blob, "arrayBuffer", {
            value: async () => new TextEncoder().encode("audio").buffer
          });
        }
        this.ondataavailable?.({ data: blob });
        this.onstop?.();
      }
    }
    Object.defineProperty(globalThis, "MediaRecorder", {
      configurable: true,
      value: FakeMediaRecorder
    });
    Object.defineProperty(window, "notebookAPI", {
      configurable: true,
      value: {
        saveAudio: vi.fn(async () => {
          throw new Error("disk full");
        })
      }
    });
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Recorder recordings={[]} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Ses kaydı ekle" }));
    await user.click(screen.getByRole("button", { name: /Kaydı bitir/ }));

    expect(
      await screen.findByText("Ses kaydı kaydedilemedi. Lütfen yeniden dene.")
    ).toBeTruthy();
    expect(stopTrack).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
