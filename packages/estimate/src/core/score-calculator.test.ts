import { describe, expect, it } from "vitest";

import type {
  EvaluationContext,
  EvaluationInput,
  EvaluationResult,
  PhaseResult,
  ReferenceInfo,
} from "../types";
import { GATE_MULTIPLIER_FLOOR, createEmptyPhaseResult } from "../types";
import { buildResult } from "./score-calculator";

/** Create a PhaseResult with the given score */
function phaseResult(
  phase: PhaseResult["phase"],
  score: number,
  passed = true,
): PhaseResult {
  return { ...createEmptyPhaseResult(phase), score, passed };
}

/** Minimal reference info */
function emptyReference(): ReferenceInfo {
  return {
    complexity: {
      totalFunctions: 0,
      complexFunctions: 0,
      maxComplexity: 0,
      issues: [],
    },
    duplication: { totalBlocks: 0, issues: [] },
    naming: { totalIssues: 0, issues: [] },
    jsdoc: { totalMissing: 0, totalApis: 0, issues: [] },
    schemaSync: {
      totalTypes: 20,
      emptyTypes: 0,
      mismatchedProperties: 0,
      issues: [],
    },
  };
}

function makePhases(
  overrides?: Partial<EvaluationResult.Phases>,
): EvaluationResult.Phases {
  return {
    gate: phaseResult("gate", 100),
    documentQuality: phaseResult("documentQuality", 80),
    requirementsCoverage: phaseResult("requirementsCoverage", 80),
    testCoverage: phaseResult("testCoverage", 80),
    logicCompleteness: phaseResult("logicCompleteness", 80),
    apiCompleteness: phaseResult("apiCompleteness", 80),
    ...overrides,
  };
}

function makeBuildInput(overrides?: {
  phases?: EvaluationResult.Phases;
  reference?: ReferenceInfo;
}) {
  return {
    input: { inputPath: "/test" } as EvaluationInput,
    context: {
      files: {
        typescript: Array.from({ length: 50 }, (_, i) => `file${i}.ts`),
      },
    } as unknown as EvaluationContext,
    phases: overrides?.phases ?? makePhases(),
    reference: overrides?.reference ?? emptyReference(),
    startTime: performance.now() - 100,
  };
}

describe("buildResult", () => {
  describe("basic structure", () => {
    it("returns all required fields", () => {
      const result = buildResult(makeBuildInput());
      expect(result.targetPath).toBe("/test");
      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
      expect(result.grade).toMatch(/^[A-DF]$/);
      expect(result.phases).toBeDefined();
      expect(result.reference).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.meta).toBeDefined();
      expect(result.meta.estimateVersion).toBeDefined();
    });
  });

  describe("weighted score calculation", () => {
    it("all phases at 100 with perfect gate → score 100", () => {
      const phases = makePhases({
        gate: phaseResult("gate", 100),
        documentQuality: phaseResult("documentQuality", 100),
        requirementsCoverage: phaseResult("requirementsCoverage", 100),
        testCoverage: phaseResult("testCoverage", 100),
        logicCompleteness: phaseResult("logicCompleteness", 100),
        apiCompleteness: phaseResult("apiCompleteness", 100),
      });
      const result = buildResult(makeBuildInput({ phases }));
      expect(result.totalScore).toBe(100);
      expect(result.grade).toBe("A");
    });

    it("all phases at 0 with perfect gate → score 0", () => {
      const phases = makePhases({
        gate: phaseResult("gate", 100),
        documentQuality: phaseResult("documentQuality", 0),
        requirementsCoverage: phaseResult("requirementsCoverage", 0),
        testCoverage: phaseResult("testCoverage", 0),
        logicCompleteness: phaseResult("logicCompleteness", 0),
        apiCompleteness: phaseResult("apiCompleteness", 0),
      });
      const result = buildResult(makeBuildInput({ phases }));
      expect(result.totalScore).toBe(0);
    });

    it("respects PHASE_WEIGHTS relative importance", () => {
      // logicCompleteness (0.30) is the heaviest weight
      // Putting 100 only in logicCompleteness vs only in documentQuality (0.07)
      const phasesLogic = makePhases({
        gate: phaseResult("gate", 100),
        documentQuality: phaseResult("documentQuality", 0),
        requirementsCoverage: phaseResult("requirementsCoverage", 0),
        testCoverage: phaseResult("testCoverage", 0),
        logicCompleteness: phaseResult("logicCompleteness", 100),
        apiCompleteness: phaseResult("apiCompleteness", 0),
      });
      const phasesDoc = makePhases({
        gate: phaseResult("gate", 100),
        documentQuality: phaseResult("documentQuality", 100),
        requirementsCoverage: phaseResult("requirementsCoverage", 0),
        testCoverage: phaseResult("testCoverage", 0),
        logicCompleteness: phaseResult("logicCompleteness", 0),
        apiCompleteness: phaseResult("apiCompleteness", 0),
      });
      const resultLogic = buildResult(makeBuildInput({ phases: phasesLogic }));
      const resultDoc = buildResult(makeBuildInput({ phases: phasesDoc }));
      expect(resultLogic.totalScore).toBeGreaterThan(resultDoc.totalScore);
    });

    it("normalizes weights when goldenSet is absent", () => {
      // Without goldenSet, active weights = 0.85, normalized to 1.0
      // All phases at 80 → weighted score = 80 * 1.0 = 80
      const phases = makePhases();
      const result = buildResult(makeBuildInput({ phases }));
      expect(result.totalScore).toBe(80);
    });

    it("includes goldenSet when present", () => {
      const phases = makePhases({
        goldenSet: phaseResult("goldenSet", 50),
      });
      // With goldenSet present, all weights sum to 1.0, no normalization needed
      // All scoring phases at 80, goldenSet at 50
      // Score = 80*0.07 + 80*0.18 + 80*0.23 + 80*0.30 + 80*0.07 + 50*0.15
      // = 5.6 + 14.4 + 18.4 + 24 + 5.6 + 7.5 = 75.5 → 76
      const result = buildResult(makeBuildInput({ phases }));
      expect(result.totalScore).toBe(76);
    });
  });

  describe("gate multiplier", () => {
    it("perfect gate (100) → multiplier 1.0, no score reduction", () => {
      const phases = makePhases({ gate: phaseResult("gate", 100) });
      const result = buildResult(makeBuildInput({ phases }));
      expect(result.totalScore).toBe(80); // 80 * 1.0
    });

    it("gate with penalties → multiplier between GATE_MULTIPLIER_FLOOR and 1.0", () => {
      // gate score = 50, passed = true
      // rawGateMultiplier = 0.5
      // gateMultiplier = 0.85 + 0.5 * (1 - 0.85) = 0.85 + 0.075 = 0.925
      // score = 80 * 0.925 = 74
      const gate = phaseResult("gate", 50);
      gate.passed = true;
      const phases = makePhases({ gate });
      const result = buildResult(makeBuildInput({ phases }));
      expect(result.totalScore).toBe(74);
    });

    it("gate score 0 (passed) → multiplier is exactly GATE_MULTIPLIER_FLOOR", () => {
      const gate = phaseResult("gate", 0);
      gate.passed = true;
      const phases = makePhases({ gate });
      const result = buildResult(makeBuildInput({ phases }));
      // 80 * 0.85 = 68
      expect(result.totalScore).toBe(68);
    });

    it("GATE_MULTIPLIER_FLOOR is 0.85", () => {
      expect(GATE_MULTIPLIER_FLOOR).toBe(0.85);
    });
  });

  describe("gate failure", () => {
    it("gate failed at no-source → score 0", () => {
      const gate = phaseResult("gate", 0);
      gate.passed = false;
      gate.metrics = { failedAt: "no-source" };
      const phases = makePhases({ gate });
      const result = buildResult(makeBuildInput({ phases }));
      expect(result.totalScore).toBe(0);
      expect(result.grade).toBe("F");
    });

    it("gate failed at no-nestjs-artifacts → score 0", () => {
      const gate = phaseResult("gate", 0);
      gate.passed = false;
      gate.metrics = { failedAt: "no-nestjs-artifacts" };
      const phases = makePhases({ gate });
      const result = buildResult(makeBuildInput({ phases }));
      expect(result.totalScore).toBe(0);
    });

    it("gate failed at runtime → score 0", () => {
      const gate = phaseResult("gate", 0);
      gate.passed = false;
      gate.metrics = { failedAt: "runtime" };
      const phases = makePhases({ gate });
      const result = buildResult(makeBuildInput({ phases }));
      expect(result.totalScore).toBe(0);
    });

    it("gate failed with type errors → partial credit up to 30", () => {
      const gate = phaseResult("gate", 0);
      gate.passed = false;
      gate.metrics = { failedAt: "type-errors", errorRatio: 20 };
      const phases = makePhases({ gate });
      const result = buildResult(makeBuildInput({ phases }));
      // partial = min(30, max(0, round(30 * (1 - 20/100)))) = min(30, round(24)) = 24
      expect(result.totalScore).toBe(24);
    });

    it("gate failed with 100% error ratio → score 0", () => {
      const gate = phaseResult("gate", 0);
      gate.passed = false;
      gate.metrics = { failedAt: "type-errors", errorRatio: 100 };
      const phases = makePhases({ gate });
      const result = buildResult(makeBuildInput({ phases }));
      expect(result.totalScore).toBe(0);
    });

    it("gate failed with 0% error ratio → fallback to 50 (JS falsy) → partial credit 15", () => {
      // Note: `(gateMetrics.errorRatio as number) || 50` treats 0 as falsy → defaults to 50
      const gate = phaseResult("gate", 0);
      gate.passed = false;
      gate.metrics = { failedAt: "type-errors", errorRatio: 0 };
      const phases = makePhases({ gate });
      const result = buildResult(makeBuildInput({ phases }));
      // round(30 * (1 - 50/100)) = 15
      expect(result.totalScore).toBe(15);
    });

    it("gate failed with no metrics → defaults errorRatio to 50 → partial credit", () => {
      const gate = phaseResult("gate", 0);
      gate.passed = false;
      gate.metrics = {};
      const phases = makePhases({ gate });
      const result = buildResult(makeBuildInput({ phases }));
      // errorRatio default 50 → round(30 * (1 - 50/100)) = 15
      expect(result.totalScore).toBe(15);
    });
  });

  describe("issue deduplication", () => {
    it("deduplicates issues by code:file:line", () => {
      const issue = {
        code: "TS2339",
        message: "prop missing",
        severity: "critical" as const,
        location: { file: "a.ts", line: 10 },
      };
      const phases = makePhases({
        gate: { ...phaseResult("gate", 100), issues: [issue, issue] },
        documentQuality: {
          ...phaseResult("documentQuality", 80),
          issues: [issue],
        },
      });
      const result = buildResult(makeBuildInput({ phases }));
      expect(result.criticalIssues).toHaveLength(1);
      expect(result.summary.criticalCount).toBe(1);
    });
  });

  describe("grade mapping", () => {
    it.each([
      [100, "A"],
      [90, "A"],
      [89, "B"],
      [80, "B"],
      [79, "C"],
      [70, "C"],
      [69, "D"],
      [60, "D"],
      [59, "F"],
      [0, "F"],
    ])("score %d → grade %s", (targetScore, expectedGrade) => {
      // Use perfect gate and set all phases to targetScore to get exact score
      const phases = makePhases({
        gate: phaseResult("gate", 100),
        documentQuality: phaseResult("documentQuality", targetScore),
        requirementsCoverage: phaseResult("requirementsCoverage", targetScore),
        testCoverage: phaseResult("testCoverage", targetScore),
        logicCompleteness: phaseResult("logicCompleteness", targetScore),
        apiCompleteness: phaseResult("apiCompleteness", targetScore),
      });
      const result = buildResult(makeBuildInput({ phases }));
      expect(result.grade).toBe(expectedGrade);
    });
  });

  describe("penalties integration", () => {
    it("subtracts penalty from total score", () => {
      // Create a scenario with schema sync penalty (totalTypes = 0 → base 3)
      const ref = emptyReference();
      ref.schemaSync = {
        totalTypes: 0,
        emptyTypes: 0,
        mismatchedProperties: 0,
        issues: [],
      };
      const phases = makePhases();
      const resultClean = buildResult(makeBuildInput({ phases }));
      const resultWithPenalty = buildResult(
        makeBuildInput({ phases, reference: ref }),
      );
      expect(resultWithPenalty.totalScore).toBeLessThan(resultClean.totalScore);
      expect(resultWithPenalty.penalties).toBeDefined();
    });

    it("does not apply penalties when gate fails", () => {
      const ref = emptyReference();
      ref.schemaSync = {
        totalTypes: 0,
        emptyTypes: 0,
        mismatchedProperties: 0,
        issues: [],
      };
      const gate = phaseResult("gate", 0);
      gate.passed = false;
      gate.metrics = { failedAt: "type-errors", errorRatio: 20 };
      const phases = makePhases({ gate });
      const result = buildResult(makeBuildInput({ phases, reference: ref }));
      // Gate failed → no penalties applied, just partial credit
      expect(result.penalties).toBeUndefined();
      expect(result.totalScore).toBe(24);
    });

    it("score never goes below 0 after penalties", () => {
      const ref = emptyReference();
      ref.schemaSync = {
        totalTypes: 0,
        emptyTypes: 0,
        mismatchedProperties: 0,
        issues: [],
      };
      ref.duplication.totalBlocks = 200;
      ref.jsdoc = { totalMissing: 10, totalApis: 10, issues: [] };

      const phases = makePhases({
        gate: phaseResult("gate", 100),
        documentQuality: phaseResult("documentQuality", 5),
        requirementsCoverage: phaseResult("requirementsCoverage", 5),
        testCoverage: phaseResult("testCoverage", 5),
        logicCompleteness: phaseResult("logicCompleteness", 5),
        apiCompleteness: phaseResult("apiCompleteness", 5),
      });
      const result = buildResult(makeBuildInput({ phases, reference: ref }));
      expect(result.totalScore).toBeGreaterThanOrEqual(0);
    });
  });
});
