import { describe, expect, it } from "vitest";
import {
  calculateProjectedGpa,
  calculateTermGpa,
  letterFromScore
} from "./grade";

describe("Doğuş Üniversitesi not hesapları", () => {
  it("sayısal notları doğru harf notuna çevirir", () => {
    expect(letterFromScore(95)).toBe("A+");
    expect(letterFromScore(89)).toBe("B+");
    expect(letterFromScore(40)).toBe("D");
    expect(letterFromScore(39)).toBe("F");
  });

  it("AKTS ağırlıklı dönem ortalamasını hesaplar", () => {
    const result = calculateTermGpa([
      { id: "1", course: "A", ects: 6, letter: "A+" },
      { id: "2", course: "B", ects: 4, letter: "B" }
    ]);
    expect(result.totalEcts).toBe(10);
    expect(result.gpa).toBeCloseTo(3.6);
  });

  it("mevcut genel ortalamaya yeni dönemi ekler", () => {
    const projected = calculateProjectedGpa(100, 2.5, [
      { id: "1", course: "A", ects: 20, letter: "A+" }
    ]);
    expect(projected).toBeCloseTo(2.75);
  });
});
