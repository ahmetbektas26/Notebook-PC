import { describe, expect, it } from "vitest";
import { createInitialData, migrateAppData } from "./data";

describe("uygulama verisi", () => {
  it("yeni kullanıcıyı tamamen boş başlatır", () => {
    const data = createInitialData();
    expect(data.version).toBe(2);
    expect(data.courses).toEqual([]);
    expect(data.notes).toEqual([]);
    expect(data.plannerItems).toEqual([]);
    expect(data.goals).toEqual([]);
    expect(data.settings.currentCredits).toBe(0);
    expect(data.settings.currentGpa).toBe(0);
  });

  it("eski demo verisini gerçek kullanıcı verisi gibi taşımaz", () => {
    const migrated = migrateAppData({
      version: 1,
      courses: [
        {
          id: "course",
          name: "Data Structures",
          code: "COME 218",
          color: "#fff",
          createdAt: "2026-01-01"
        }
      ],
      notes: [
        {
          id: "note",
          courseId: "course",
          topic: "Başlangıç",
          title: "Notebook-PC'ye hoş geldin",
          content: "demo",
          tags: [],
          favorite: true,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
          audio: []
        }
      ],
      reminders: [],
      grades: [],
      settings: { theme: "dark", currentCredits: 183, currentGpa: 2.43 }
    });
    expect(migrated?.courses).toEqual([]);
    expect(migrated?.notes).toEqual([]);
    expect(migrated?.settings.currentCredits).toBe(0);
    expect(migrated?.settings.theme).toBe("dark");
  });

  it("eski gerçek kullanıcı verisini korurken demo kaydını ayıklar", () => {
    const migrated = migrateAppData({
      version: 1,
      courses: [
        {
          id: "demo-course",
          name: "Data Structures",
          code: "COME 218",
          color: "#fff",
          createdAt: "2026-01-01"
        }
      ],
      notes: [
        {
          id: "demo-note",
          courseId: "demo-course",
          topic: "Başlangıç",
          title: "Notebook-PC'ye hoş geldin",
          content: "demo",
          tags: [],
          favorite: true,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
          audio: []
        },
        {
          id: "real-note",
          courseId: null,
          topic: "Fikir",
          title: "Gerçek not",
          content: "korunmalı",
          tags: [],
          favorite: false,
          createdAt: "2026-01-02",
          updatedAt: "2026-01-02",
          audio: []
        }
      ],
      reminders: [],
      grades: [],
      settings: { theme: "light", currentCredits: 183, currentGpa: 2.43 }
    });
    expect(migrated?.notes.map((note) => note.id)).toEqual(["real-note"]);
    expect(migrated?.courses).toEqual([]);
  });
});
