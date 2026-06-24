import { buildResult } from "@autobe/estimate/src/core/score-calculator";
import {
  GATE_MULTIPLIER_FLOOR,
  createEmptyPhaseResult,
} from "@autobe/estimate/src/types";
import type {
  EvaluationContext,
  EvaluationInput,
  EvaluationResult,
  Issue,
  PhaseResult,
  ReferenceInfo,
} from "@autobe/estimate/src/types";
import assert from "node:assert/strict";

const phaseResult = (
  phase: PhaseResult["phase"],
  score: number,
  passed = true,
): PhaseResult => ({ ...createEmptyPhaseResult(phase), score, passed });

const emptyReference = (): ReferenceInfo => ({
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
});

const makePhases = (
  overrides?: Partial<EvaluationResult.Phases>,
): EvaluationResult.Phases => ({
  gate: phaseResult("gate", 100),
  documentQuality: phaseResult("documentQuality", 80),
  requirementsCoverage: phaseResult("requirementsCoverage", 80),
  testCoverage: phaseResult("testCoverage", 80),
  logicCompleteness: phaseResult("logicCompleteness", 80),
  apiCompleteness: phaseResult("apiCompleteness", 80),
  ...overrides,
});

const makeBuildInput = (overrides?: {
  phases?: EvaluationResult.Phases;
  reference?: ReferenceInfo;
}) => ({
  input: { inputPath: "/test" } as EvaluationInput,
  context: {
    files: {
      typescript: Array.from({ length: 50 }, (_, i) => `file${i}.ts`),
    },
  } as unknown as EvaluationContext,
  phases: overrides?.phases ?? makePhases(),
  reference: overrides?.reference ?? emptyReference(),
  startTime: performance.now() - 100,
});

export const test_estimate_score_calculator = (): void => {
  const basic = buildResult(makeBuildInput());
  assert.equal(basic.targetPath, "/test");
  assert(basic.totalScore >= 0);
  assert(basic.totalScore <= 100);
  assert.match(basic.grade, /^[A-DF]$/);
  assert(basic.phases !== undefined);
  assert(basic.reference !== undefined);
  assert(basic.summary !== undefined);
  assert(basic.meta.estimateVersion !== undefined);

  assert.equal(
    buildResult(
      makeBuildInput({
        phases: makePhases({
          gate: phaseResult("gate", 100),
          documentQuality: phaseResult("documentQuality", 100),
          requirementsCoverage: phaseResult("requirementsCoverage", 100),
          testCoverage: phaseResult("testCoverage", 100),
          logicCompleteness: phaseResult("logicCompleteness", 100),
          apiCompleteness: phaseResult("apiCompleteness", 100),
        }),
      }),
    ).totalScore,
    100,
  );

  assert.equal(
    buildResult(
      makeBuildInput({
        phases: makePhases({
          gate: phaseResult("gate", 100),
          documentQuality: phaseResult("documentQuality", 0),
          requirementsCoverage: phaseResult("requirementsCoverage", 0),
          testCoverage: phaseResult("testCoverage", 0),
          logicCompleteness: phaseResult("logicCompleteness", 0),
          apiCompleteness: phaseResult("apiCompleteness", 0),
        }),
      }),
    ).totalScore,
    0,
  );

  const logicOnly = buildResult(
    makeBuildInput({
      phases: makePhases({
        gate: phaseResult("gate", 100),
        documentQuality: phaseResult("documentQuality", 0),
        requirementsCoverage: phaseResult("requirementsCoverage", 0),
        testCoverage: phaseResult("testCoverage", 0),
        logicCompleteness: phaseResult("logicCompleteness", 100),
        apiCompleteness: phaseResult("apiCompleteness", 0),
      }),
    }),
  );
  const documentOnly = buildResult(
    makeBuildInput({
      phases: makePhases({
        gate: phaseResult("gate", 100),
        documentQuality: phaseResult("documentQuality", 100),
        requirementsCoverage: phaseResult("requirementsCoverage", 0),
        testCoverage: phaseResult("testCoverage", 0),
        logicCompleteness: phaseResult("logicCompleteness", 0),
        apiCompleteness: phaseResult("apiCompleteness", 0),
      }),
    }),
  );
  assert(logicOnly.totalScore > documentOnly.totalScore);

  assert.equal(
    buildResult(makeBuildInput({ phases: makePhases() })).totalScore,
    80,
  );
  assert.equal(
    buildResult(
      makeBuildInput({
        phases: makePhases({ goldenSet: phaseResult("goldenSet", 50) }),
      }),
    ).totalScore,
    76,
  );

  assert.equal(GATE_MULTIPLIER_FLOOR, 0.85);
  assert.equal(
    buildResult(
      makeBuildInput({
        phases: makePhases({ gate: phaseResult("gate", 100) }),
      }),
    ).totalScore,
    80,
  );
  assert.equal(
    buildResult(
      makeBuildInput({ phases: makePhases({ gate: phaseResult("gate", 50) }) }),
    ).totalScore,
    74,
  );
  assert.equal(
    buildResult(
      makeBuildInput({ phases: makePhases({ gate: phaseResult("gate", 0) }) }),
    ).totalScore,
    68,
  );

  for (const failedAt of ["no-source", "no-nestjs-artifacts", "runtime"]) {
    const gate = phaseResult("gate", 0, false);
    gate.metrics = { failedAt };
    const result = buildResult(
      makeBuildInput({ phases: makePhases({ gate }) }),
    );
    assert.equal(result.totalScore, 0);
    if (failedAt === "no-source") assert.equal(result.grade, "F");
  }

  for (const [errorRatio, expected] of [
    [20, 24],
    [100, 0],
    [0, 15],
  ] as const) {
    const gate = phaseResult("gate", 0, false);
    gate.metrics = { failedAt: "type-errors", errorRatio };
    assert.equal(
      buildResult(makeBuildInput({ phases: makePhases({ gate }) })).totalScore,
      expected,
    );
  }

  const metricslessGate = phaseResult("gate", 0, false);
  metricslessGate.metrics = {};
  assert.equal(
    buildResult(
      makeBuildInput({ phases: makePhases({ gate: metricslessGate }) }),
    ).totalScore,
    15,
  );

  const issue: Issue = {
    id: "ts2339-a-10",
    code: "TS2339",
    category: "type-error",
    message: "prop missing",
    severity: "critical" as const,
    autoFixable: false,
    location: { file: "a.ts", line: 10 },
  };
  const deduplicated = buildResult(
    makeBuildInput({
      phases: makePhases({
        gate: { ...phaseResult("gate", 100), issues: [issue, issue] },
        documentQuality: {
          ...phaseResult("documentQuality", 80),
          issues: [issue],
        },
      }),
    }),
  );
  assert.equal(deduplicated.criticalIssues.length, 1);
  assert.equal(deduplicated.summary.criticalCount, 1);

  for (const [targetScore, expectedGrade] of [
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
  ] as const) {
    const result = buildResult(
      makeBuildInput({
        phases: makePhases({
          gate: phaseResult("gate", 100),
          documentQuality: phaseResult("documentQuality", targetScore),
          requirementsCoverage: phaseResult(
            "requirementsCoverage",
            targetScore,
          ),
          testCoverage: phaseResult("testCoverage", targetScore),
          logicCompleteness: phaseResult("logicCompleteness", targetScore),
          apiCompleteness: phaseResult("apiCompleteness", targetScore),
        }),
      }),
    );
    assert.equal(result.grade, expectedGrade);
  }

  const referenceWithPenalty = emptyReference();
  referenceWithPenalty.schemaSync = {
    totalTypes: 0,
    emptyTypes: 0,
    mismatchedProperties: 0,
    issues: [],
  };
  const cleanResult = buildResult(makeBuildInput({ phases: makePhases() }));
  const penalizedResult = buildResult(
    makeBuildInput({ phases: makePhases(), reference: referenceWithPenalty }),
  );
  assert(penalizedResult.totalScore < cleanResult.totalScore);
  assert(penalizedResult.penalties !== undefined);

  const failedGate = phaseResult("gate", 0, false);
  failedGate.metrics = { failedAt: "type-errors", errorRatio: 20 };
  const failedWithPenaltyReference = buildResult(
    makeBuildInput({
      phases: makePhases({ gate: failedGate }),
      reference: referenceWithPenalty,
    }),
  );
  assert.equal(failedWithPenaltyReference.penalties, undefined);
  assert.equal(failedWithPenaltyReference.totalScore, 24);

  const heavyPenaltyReference = emptyReference();
  heavyPenaltyReference.schemaSync = {
    totalTypes: 0,
    emptyTypes: 0,
    mismatchedProperties: 0,
    issues: [],
  };
  heavyPenaltyReference.duplication.totalBlocks = 200;
  heavyPenaltyReference.jsdoc = { totalMissing: 10, totalApis: 10, issues: [] };
  const floored = buildResult(
    makeBuildInput({
      phases: makePhases({
        gate: phaseResult("gate", 100),
        documentQuality: phaseResult("documentQuality", 5),
        requirementsCoverage: phaseResult("requirementsCoverage", 5),
        testCoverage: phaseResult("testCoverage", 5),
        logicCompleteness: phaseResult("logicCompleteness", 5),
        apiCompleteness: phaseResult("apiCompleteness", 5),
      }),
      reference: heavyPenaltyReference,
    }),
  );
  assert(floored.totalScore >= 0);
};
