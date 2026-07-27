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

  it("CSV ile gelen uç değerleri güvenli veri sınırlarına çeker", () => {
    const csv =
      "\uFEFF\"type\",\"id\",\"title\",\"details\",\"date\",\"time\",\"status\",\"tags\",\"course\",\"ects\",\"grade\"\n" +
      '"grade","1","Aşırı AKTS","","","","","","","500","Z"\n' +
      '"goal","2","Hedef","","","","900","wrong","","",""';
    const merged = mergeCsv(createInitialData(), csv);

    expect(merged.grades[0]).toEqual(
      expect.objectContaining({ ects: 30, letter: "F" })
    );
    expect(merged.goals[0]).toEqual(
      expect.objectContaining({ progress: 100, category: "personal" })
    );
  });

  it("Notebook-PC satırı olmayan veya bozuk CSV'yi sessizce başarılı saymaz", () => {
    expect(() => mergeCsv(createInitialData(), '"ad","soyad"\n"A","B"')).toThrow(
      /desteklenen/
    );
    expect(() =>
      mergeCsv(
        createInitialData(),
        '"type","title"\n"note","kapanmamış'
      )
    ).toThrow(/kapanmamış/);
  });
});
