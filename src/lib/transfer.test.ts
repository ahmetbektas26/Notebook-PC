import { describe, expect, it } from "vitest";
import { createInitialData } from "./data";
import { dataToCsv, markdownFileToNote, mergeCsv } from "./transfer";

describe("veri aktarımı", () => {
  it("CSV dışa aktarımını yeni veriye geri alır", () => {
    const source = createInitialData();
    source.goals.push({
      id: "goal",
      title: "Portfolyoyu bitir",
      description: "Projeleri düzenle",
      category: "career",
      progress: 40,
      deadline: "2026-08-01",
      createdAt: "2026-07-27T10:00:00Z"
    });
    const merged = mergeCsv(createInitialData(), dataToCsv(source));
    expect(merged.goals).toHaveLength(1);
    expect(merged.goals[0].title).toBe("Portfolyoyu bitir");
    expect(merged.goals[0].progress).toBe(40);
  });

  it("Markdown başlığını not başlığı olarak kullanır", () => {
    const note = markdownFileToNote("dosya.md", "# Deneme\n\nİçerik");
    expect(note.title).toBe("Deneme");
    expect(note.content).toContain("İçerik");
  });
});
