import { describe, expect, it } from "vitest";
import type { Course, Note } from "../types";
import { createInitialData } from "./data";
import { removeCourseAndPreserveNotes } from "./courses";

const course = (id: string): Course => ({
  id,
  name: `Ders ${id}`,
  code: id.toUpperCase(),
  color: "#e07a5f",
  createdAt: "2026-01-01T10:00:00.000Z"
});

const note = (id: string, courseId: string | null): Note => ({
  id,
  courseId,
  topic: "Konu",
  title: `Not ${id}`,
  content: "",
  tags: [],
  favorite: false,
  createdAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-01T10:00:00.000Z",
  audio: [],
  attachments: []
});

describe("removeCourseAndPreserveNotes", () => {
  it("dersi siler ve bağlı notları kişisel deftere taşır", () => {
    const data = {
      ...createInitialData(),
      courses: [course("one"), course("two")],
      notes: [note("a", "one"), note("b", "one"), note("c", "two"), note("d", null)],
      grades: [{ id: "grade", course: "Ders one", ects: 6, letter: "A" as const }]
    };

    const result = removeCourseAndPreserveNotes(data, "one");

    expect(result.removed).toBe(true);
    expect(result.movedNotes).toBe(2);
    expect(result.data.courses.map((item) => item.id)).toEqual(["two"]);
    expect(result.data.notes.map((item) => [item.id, item.courseId])).toEqual([
      ["a", null],
      ["b", null],
      ["c", "two"],
      ["d", null]
    ]);
    expect(result.data.grades).toEqual(data.grades);
  });

  it("olmayan ders kimliği için veriyi değiştirmez", () => {
    const data = {
      ...createInitialData(),
      courses: [course("one")],
      notes: [note("a", "one")]
    };

    const result = removeCourseAndPreserveNotes(data, "missing");

    expect(result).toEqual({ data, movedNotes: 0, removed: false });
    expect(result.data).toBe(data);
  });
});
