import type { GradeEntry, GradeLetter } from "../types";

export const GRADE_POINTS: Record<GradeLetter, number> = {
  "A+": 4,
  A: 3.75,
  "B+": 3.5,
  B: 3,
  "C+": 2.5,
  C: 2,
  "D+": 1.5,
  D: 1,
  F: 0
};

export const GRADE_RANGES: Array<{
  letter: GradeLetter;
  min: number;
  max: number;
}> = [
  { letter: "A+", min: 95, max: 100 },
  { letter: "A", min: 90, max: 94 },
  { letter: "B+", min: 85, max: 89 },
  { letter: "B", min: 75, max: 84 },
  { letter: "C+", min: 65, max: 74 },
  { letter: "C", min: 55, max: 64 },
  { letter: "D+", min: 45, max: 54 },
  { letter: "D", min: 40, max: 44 },
  { letter: "F", min: 0, max: 39 }
];

export function letterFromScore(score: number): GradeLetter {
  if (!Number.isFinite(score)) return "F";
  return (
    GRADE_RANGES.find(({ min, max }) => score >= min && score <= max)?.letter ??
    "F"
  );
}

export function calculateTermGpa(entries: GradeEntry[]) {
  const valid = entries.filter(
    (entry) => entry.ects > 0 && Number.isFinite(entry.ects)
  );
  const totalEcts = valid.reduce((sum, entry) => sum + entry.ects, 0);
  const totalPoints = valid.reduce(
    (sum, entry) => sum + entry.ects * GRADE_POINTS[entry.letter],
    0
  );
  return {
    totalEcts,
    totalPoints,
    gpa: totalEcts ? totalPoints / totalEcts : 0
  };
}

export function calculateProjectedGpa(
  currentCredits: number,
  currentGpa: number,
  entries: GradeEntry[]
) {
  const term = calculateTermGpa(entries);
  const safeCredits = Math.max(0, currentCredits || 0);
  const safeGpa = Math.min(4, Math.max(0, currentGpa || 0));
  const totalCredits = safeCredits + term.totalEcts;
  if (!totalCredits) return 0;
  return (safeCredits * safeGpa + term.totalPoints) / totalCredits;
}
