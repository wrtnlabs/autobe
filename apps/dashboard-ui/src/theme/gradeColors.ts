import type { Grade } from "../types/benchmark";

export interface GradeColor {
  bg: string;
  text: string;
}

const GRADE_COLORS_LIGHT: Record<Grade, GradeColor> = {
  A: { bg: "#dbeafe", text: "#1d4ed8" },
  B: { bg: "#dcfce7", text: "#15803d" },
  C: { bg: "#fef9c3", text: "#a16207" },
  D: { bg: "#fed7aa", text: "#c2410c" },
  F: { bg: "#fecaca", text: "#b91c1c" },
};

const GRADE_COLORS_DARK: Record<Grade, GradeColor> = {
  A: { bg: "#1e3a5f", text: "#93c5fd" },
  B: { bg: "#14532d", text: "#86efac" },
  C: { bg: "#422006", text: "#fde047" },
  D: { bg: "#431407", text: "#fdba74" },
  F: { bg: "#450a0a", text: "#fca5a5" },
};

export function getGradeColor(
  grade: Grade,
  mode: "dark" | "light",
): GradeColor {
  return mode === "dark" ? GRADE_COLORS_DARK[grade] : GRADE_COLORS_LIGHT[grade];
}

export function getScoreColor(score: number, mode: "dark" | "light"): string {
  if (score >= 90) return getGradeColor("A", mode).text;
  if (score >= 80) return getGradeColor("B", mode).text;
  if (score >= 70) return getGradeColor("C", mode).text;
  if (score >= 60) return getGradeColor("D", mode).text;
  return getGradeColor("F", mode).text;
}
