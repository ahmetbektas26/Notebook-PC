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

export function clampNumber(
  value: number,
  minimum: number,
  maximum: number,
  fallback = minimum
) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
}

export function normalizeEcts(value: number) {
  return clampNumber(value, 1, 30, 1);
}

export function normalizeCredits(value: number) {
  return clampNumber(value, 0, 1000, 0);
}

export function normalizeGpa(value: number) {
  return clampNumber(value, 0, 4, 0);
}

export function letterFromScore(score: number): GradeLetter {
  if (!Number.isFinite(score) || score < 0 || score > 100) return "F";
  return GRADE_RANGES.find(({ min }) => score >= min)?.letter ?? "F";
}

export function calculateTermGpa(entries: GradeEntry[]) {
  const valid = entries.filter(
    (entry) =>
      entry.ects > 0 &&
      entry.ects <= 30 &&
      Number.isFinite(entry.ects) &&
      Object.hasOwn(GRADE_POINTS, entry.letter)
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
  const safeCredits = normalizeCredits(currentCredits);
  const safeGpa = normalizeGpa(currentGpa);
  const totalCredits = safeCredits + term.totalEcts;
  if (!totalCredits) return 0;
  return (safeCredits * safeGpa + term.totalPoints) / totalCredits;
}

export function calculateRequiredGpa(
  currentCredits: number,
  currentGpa: number,
  targetGpa: number,
  graduationCredits: number
) {
  const safeCurrentCredits = normalizeCredits(currentCredits);
  const safeCurrentGpa = normalizeGpa(currentGpa);
  const safeTargetGpa = normalizeGpa(targetGpa);
  const safeGraduationCredits = Math.max(
    safeCurrentCredits,
    normalizeCredits(graduationCredits)
  );
  const remainingCredits = safeGraduationCredits - safeCurrentCredits;

  if (!remainingCredits) {
    return {
      remainingCredits: 0,
      requiredGpa:
        safeCurrentGpa >= safeTargetGpa ? 0 : Number.POSITIVE_INFINITY
    };
  }

  return {
    remainingCredits,
    requiredGpa:
      (safeTargetGpa * safeGraduationCredits -
        safeCurrentGpa * safeCurrentCredits) /
      remainingCredits
  };
}
