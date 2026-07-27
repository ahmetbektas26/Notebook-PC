import { describe, expect, it } from "vitest";
import {
  calculateProjectedGpa,
  calculateRequiredGpa,
  calculateTermGpa,
  letterFromScore,
  normalizeCredits,
  normalizeEcts,
  normalizeGpa
} from "./grade";

describe("Doğuş Üniversitesi not hesapları", () => {
  it("sayısal notları doğru harf notuna çevirir", () => {
    expect(letterFromScore(95)).toBe("A+");
    expect(letterFromScore(94.5)).toBe("A");
    expect(letterFromScore(89)).toBe("B+");
    expect(letterFromScore(84.9)).toBe("B");
    expect(letterFromScore(40)).toBe("D");
    expect(letterFromScore(39)).toBe("F");
    expect(letterFromScore(-1)).toBe("F");
    expect(letterFromScore(101)).toBe("F");
    expect(letterFromScore(Number.NaN)).toBe("F");
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

  it("bozuk veya negatif mevcut değerleri güvenli biçimde sıfırlar", () => {
    expect(calculateProjectedGpa(Number.POSITIVE_INFINITY, Number.NaN, []))
      .toBe(0);
  });

  it("geçersiz AKTS kayıtlarını dönem hesabına katmaz", () => {
    const result = calculateTermGpa([
      { id: "negative", course: "A", ects: -6, letter: "A+" },
      { id: "huge", course: "B", ects: 300, letter: "A+" },
      { id: "valid", course: "C", ects: 5, letter: "B" }
    ]);
    expect(result.totalEcts).toBe(5);
    expect(result.gpa).toBe(3);
  });

  it("form sayılarını akademik sınırlar içinde tutar", () => {
    expect(normalizeEcts(-5)).toBe(1);
    expect(normalizeEcts(80)).toBe(30);
    expect(normalizeCredits(Number.NaN)).toBe(0);
    expect(normalizeCredits(4000)).toBe(1000);
    expect(normalizeGpa(-1)).toBe(0);
    expect(normalizeGpa(5)).toBe(4);
  });

  it("mezuniyet AKTS'si bittiyse ulaşılamayan hedefi mümkün göstermez", () => {
    expect(calculateRequiredGpa(240, 2.5, 3, 240)).toEqual({
      remainingCredits: 0,
      requiredGpa: Number.POSITIVE_INFINITY
    });
    expect(calculateRequiredGpa(240, 3.2, 3, 240)).toEqual({
      remainingCredits: 0,
      requiredGpa: 0
    });
  });
});
