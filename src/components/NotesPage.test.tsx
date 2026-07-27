// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialData } from "../lib/data";
import type { Note } from "../types";
import NotesPage from "./NotesPage";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, "notebookAPI");
});

describe("not silme", () => {
  it("bir ek dosyası silinemese de notu kaldırır ve kullanıcıyı uyarır", async () => {
    const note: Note = {
      id: "note",
      courseId: null,
      topic: "Konu",
      title: "Silinecek not",
      content: "",
      tags: [],
      favorite: false,
      createdAt: "2026-07-27T10:00:00Z",
      updatedAt: "2026-07-27T10:00:00Z",
      audio: [
        {
          id: "audio",
          fileName: "audio.webm",
          duration: 10,
          createdAt: "2026-07-27T10:00:00Z"
        }
      ],
      attachments: [
        {
          id: "pdf",
          fileName: "file.pdf",
          originalName: "Ders.pdf",
          size: 100,
          createdAt: "2026-07-27T10:00:00Z",
          annotations: []
        }
      ]
    };
    const data = { ...createInitialData(), notes: [note] };
    const api = {
      deleteAudio: vi.fn(async () => {
        throw new Error("locked");
      }),
      deleteAttachment: vi.fn(async () => true)
    };
    Object.defineProperty(window, "notebookAPI", {
      configurable: true,
      value: api
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onDataChange = vi.fn();
    const onToast = vi.fn();
    const user = userEvent.setup();
    render(
      <NotesPage
        data={data}
        onDataChange={onDataChange}
        scope="personal"
        activeCourseId={null}
        search=""
        onToast={onToast}
      />
    );

    await user.click(screen.getByRole("button", { name: "Notu sil" }));

    await waitFor(() => expect(api.deleteAudio).toHaveBeenCalled());
    expect(api.deleteAttachment).toHaveBeenCalledWith("file.pdf");
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ notes: [] })
    );
    expect(onToast).toHaveBeenCalledWith(
      "Not silindi; 1 ek dosya diskten kaldırılamadı."
    );
  });
});
