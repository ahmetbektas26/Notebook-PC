import { describe, expect, it } from "vitest";
import { createInitialData } from "./data";
import { searchAppData } from "./search";

describe("genel arama", () => {
  it("Türkçe karakterleri, PDF adlarını ve takvim kayıtlarını bulur", () => {
    const data = createInitialData();
    data.notes.push({
      id: "note",
      courseId: null,
      topic: "Çalışma",
      title: "Görüşme hazırlığı",
      content: "Önemli maddeler",
      tags: ["kariyer"],
      favorite: false,
      createdAt: "2026-07-27T10:00:00Z",
      updatedAt: "2026-07-27T10:00:00Z",
      audio: [],
      attachments: [
        {
          id: "pdf",
          fileName: "x.pdf",
          originalName: "Özgeçmiş.pdf",
          size: 12,
          createdAt: "2026-07-27T10:00:00Z",
          annotations: []
        }
      ]
    });
    data.plannerItems.push({
      id: "plan",
      title: "Mülakat provası",
      details: "",
      date: "2026-07-28",
      time: "12:00",
      kind: "task",
      reminder: false,
      repeat: "none",
      completed: false,
      createdAt: "2026-07-27T10:00:00Z"
    });
    expect(searchAppData(data, "ozgecmis")[0].kind).toBe("pdf");
    expect(searchAppData(data, "mulakat")[0].id).toBe("plan");
  });
});
