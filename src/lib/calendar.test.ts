import { describe, expect, it } from "vitest";
import { monthCells, toDateKey } from "./calendar";

describe("takvim", () => {
  it("ayı pazartesiden başlayan altı haftalık görünüm olarak üretir", () => {
    const cells = monthCells(new Date(2026, 6, 1, 12));
    expect(cells).toHaveLength(42);
    expect(cells[0].getDay()).toBe(1);
    expect(toDateKey(cells[0])).toBe("2026-06-29");
  });
});
