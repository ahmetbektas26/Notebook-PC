import { describe, expect, it } from "vitest";
import { createInitialData } from "./data";
import { weeklyStats } from "./analytics";

describe("haftalık değerlendirme", () => {
  it("seçili haftanın görev ve odak sayılarını hesaplar", () => {
    const data = createInitialData();
    data.plannerItems.push(
      {
        id: "a",
        title: "Bitti",
        details: "",
        date: "2026-07-27",
        time: "",
        kind: "task",
        reminder: false,
        repeat: "none",
        completed: true,
        completedAt: "2026-07-27T10:00:00Z",
        createdAt: "2026-07-27T09:00:00Z"
      },
      {
        id: "b",
        title: "Açık",
        details: "",
        date: "2026-07-28",
        time: "",
        kind: "task",
        reminder: false,
        repeat: "none",
        completed: false,
        createdAt: "2026-07-27T09:00:00Z"
      }
    );
    data.focusSessions.push({
      id: "focus",
      minutes: 25,
      completedAt: "2026-07-29T10:00:00"
    });
    const stats = weeklyStats(data, new Date("2026-07-30T12:00:00"));
    expect(stats.completed).toBe(1);
    expect(stats.planned).toBe(2);
    expect(stats.completionRate).toBe(50);
    expect(stats.focusMinutes).toBe(25);
  });
});
