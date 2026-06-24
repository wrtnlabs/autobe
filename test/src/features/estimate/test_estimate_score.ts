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
} from "@autobe/estimate/src/types/constants";
import {
  createEmptyPhaseResult,
  scoreToGrade,
} from "@autobe/estimate/src/types/score-utils";
import assert from "node:assert/strict";

export const test_estimate_score = (): void => {
  const activePhaseSum: number = [
    PHASE_WEIGHTS.documentQuality,
    PHASE_WEIGHTS.requirementsCoverage,
    PHASE_WEIGHTS.testCoverage,
    PHASE_WEIGHTS.logicCompleteness,
    PHASE_WEIGHTS.apiCompleteness,
    PHASE_WEIGHTS.goldenSet,
  ].reduce((a, b) => a + b, 0);
  assert(Math.abs(activePhaseSum - 1.0) < 0.001);

  for (const phase of [
    "requirements",
    "database",
    "api",
    "test",
    "implementation",
    "functionality",
    "quality",
    "safety",
    "llmSpecific",
  ] as const) {
    assert.equal(PHASE_WEIGHTS[phase], 0);
  }

  const agentWeightSum: number = Object.values(AGENT_WEIGHTS).reduce(
    (a, b) => a + b,
    0,
  );
  assert(Math.abs(agentWeightSum - 1.0) < 0.001);

  for (const [score, grade] of [
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
  ] as const) {
    assert.equal(scoreToGrade(score), grade);
  }

  const empty = createEmptyPhaseResult("gate");
  assert.equal(empty.phase, "gate");
  assert.equal(empty.passed, true);
  assert.equal(empty.score, 0);
  assert.equal(empty.maxScore, 100);
  assert.equal(empty.weightedScore, 0);
  assert.deepEqual(empty.issues, []);
  assert.equal(empty.durationMs, 0);

  assert.equal(GATE_ERROR_THRESHOLD, 0.05);
  assert.equal(GATE_PENALTY_PER_PERCENT, 5);
  assert.equal(GATE_MULTIPLIER_FLOOR, 0.85);
  assert.equal(TYPE_CRITICAL_RATIO, 0.3);
  assert.equal(PRISMA_PENALTY_CAP, 40);
  assert.equal(MAX_COMBINED_PENALTY, 20);
  assert.equal(AGENT_WEIGHT_RATIO, 0.15);
};
