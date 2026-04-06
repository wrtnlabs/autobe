import { describe, expect, it } from "vitest";

import {
  AGENT_WEIGHTS,
  AGENT_WEIGHT_RATIO,
  GATE_ERROR_THRESHOLD,
  GATE_MULTIPLIER_FLOOR,
  GATE_PENALTY_PER_PERCENT,
  MAX_COMBINED_PENALTY,
  PHASE_WEIGHTS,
  PRISMA_PENALTY_CAP,
  TYPE_CRITICAL_RATIO,
} from "./constants";
import { createEmptyPhaseResult, scoreToGrade } from "./score-utils";

describe("PHASE_WEIGHTS", () => {
  it("active weights sum to 1.0", () => {
    const activeSum = [
      PHASE_WEIGHTS.documentQuality,
      PHASE_WEIGHTS.requirementsCoverage,
      PHASE_WEIGHTS.testCoverage,
      PHASE_WEIGHTS.logicCompleteness,
      PHASE_WEIGHTS.apiCompleteness,
      PHASE_WEIGHTS.goldenSet,
    ].reduce((a, b) => a + b, 0);
    expect(Math.abs(activeSum - 1.0)).toBeLessThan(0.001);
  });

  it("legacy weights are all zero", () => {
    const legacyPhases = [
      "requirements",
      "database",
      "api",
      "test",
      "implementation",
      "functionality",
      "quality",
      "safety",
      "llmSpecific",
    ] as const;
    for (const phase of legacyPhases) {
      expect(PHASE_WEIGHTS[phase]).toBe(0);
    }
  });
});

describe("AGENT_WEIGHTS", () => {
  it("sum to 1.0", () => {
    const sum = Object.values(AGENT_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1.0)).toBeLessThan(0.001);
  });
});

describe("scoreToGrade", () => {
  it.each([
    [95, "A"],
    [90, "A"],
    [85, "B"],
    [80, "B"],
    [75, "C"],
    [70, "C"],
    [65, "D"],
    [60, "D"],
    [55, "F"],
    [0, "F"],
  ])("score %d → grade %s", (score, grade) => {
    expect(scoreToGrade(score)).toBe(grade);
  });
});

describe("createEmptyPhaseResult", () => {
  it("returns correct defaults", () => {
    const result = createEmptyPhaseResult("gate");
    expect(result.phase).toBe("gate");
    expect(result.passed).toBe(true);
    expect(result.score).toBe(0);
    expect(result.maxScore).toBe(100);
    expect(result.weightedScore).toBe(0);
    expect(result.issues).toEqual([]);
    expect(result.durationMs).toBe(0);
  });
});

describe("scoring constants", () => {
  it("GATE_ERROR_THRESHOLD is 0.05", () => {
    expect(GATE_ERROR_THRESHOLD).toBe(0.05);
  });

  it("GATE_PENALTY_PER_PERCENT is 5", () => {
    expect(GATE_PENALTY_PER_PERCENT).toBe(5);
  });

  it("GATE_MULTIPLIER_FLOOR is 0.85", () => {
    expect(GATE_MULTIPLIER_FLOOR).toBe(0.85);
  });

  it("TYPE_CRITICAL_RATIO is 0.3", () => {
    expect(TYPE_CRITICAL_RATIO).toBe(0.3);
  });

  it("PRISMA_PENALTY_CAP is 40", () => {
    expect(PRISMA_PENALTY_CAP).toBe(40);
  });

  it("MAX_COMBINED_PENALTY is 20", () => {
    expect(MAX_COMBINED_PENALTY).toBe(20);
  });

  it("AGENT_WEIGHT_RATIO is 0.15", () => {
    expect(AGENT_WEIGHT_RATIO).toBe(0.15);
  });
});
