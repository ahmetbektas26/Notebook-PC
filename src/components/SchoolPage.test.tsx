// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Course, Note } from "../types";
import { createInitialData } from "../lib/data";
import SchoolPage from "./SchoolPage";

const course: Course = {
  id: "course",
  name: "Algoritmalar",
  code: "COME 220",
  color: "#e07a5f",
  createdAt: "2026-01-01T10:00:00.000Z"
};

const note: Note = {
  id: "note",
  courseId: course.id,
  topic: "Graf",
  title: "Ders notu",
  content: "",
  tags: [],
  favorite: false,
  createdAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-01T10:00:00.000Z",
  audio: [],
  attachments: []
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("okul ders yaşam döngüsü", () => {
  it("ders silerken bağlı notu silmez, kişisel deftere taşır", async () => {
    const data = {
      ...createInitialData(),
      courses: [course],
      notes: [note]
    };
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const onDataChange = vi.fn();
    const onToast = vi.fn();
    const user = userEvent.setup();
    render(
      <SchoolPage
        data={data}
        onDataChange={onDataChange}
        onToast={onToast}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "Algoritmalar dersini sil" })
    );

    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining("1 not silinmeyecek")
    );
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({
        courses: [],
        notes: [expect.objectContaining({ id: "note", courseId: null })]
      })
    );
    expect(onToast).toHaveBeenCalledWith(
      "Ders silindi; 1 not kişisel deftere taşındı."
    );
  });

  it("kullanıcı vazgeçerse ders ve notlara dokunmaz", async () => {
    const data = {
      ...createInitialData(),
      courses: [course],
      notes: [note]
    };
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const onDataChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SchoolPage
        data={data}
        onDataChange={onDataChange}
        onToast={vi.fn()}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "Algoritmalar dersini sil" })
    );

    expect(onDataChange).not.toHaveBeenCalled();
  });
});
