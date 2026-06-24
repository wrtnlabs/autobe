import { generateFixAdvisory } from "@autobe/estimate/src/core/fix-advisor";
import { createEmptyPhaseResult } from "@autobe/estimate/src/types";
import type {
  EvaluationResult,
  Issue,
  PhaseResult,
  ReferenceInfo,
} from "@autobe/estimate/src/types";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

let issueCounter = 0;

const makeIssue = (overrides?: Partial<Issue>): Issue => ({
  id: overrides?.id ?? `test-${++issueCounter}`,
  severity: "critical",
  category: "incomplete",
  code: "LOGIC001",
  message: "throw new Error('not implemented')",
  autoFixable: false,
  ...overrides,
});

const phaseResult = (
  phase: PhaseResult["phase"],
  score: number,
  issues: Issue[] = [],
): PhaseResult => ({
  ...createEmptyPhaseResult(phase),
  score,
  issues,
  passed: true,
});

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

const makeResult = (
  overrides?: Partial<{
    phases: Partial<EvaluationResult.Phases>;
    reference: Partial<ReferenceInfo>;
    penalties: EvaluationResult["penalties"];
  }>,
): EvaluationResult => ({
  targetPath: "/test/project",
  totalScore: 70,
  grade: "C",
  phases: {
    gate: phaseResult("gate", 100),
    documentQuality: phaseResult("documentQuality", 80),
    requirementsCoverage: phaseResult("requirementsCoverage", 80),
    testCoverage: phaseResult("testCoverage", 80),
    logicCompleteness: phaseResult("logicCompleteness", 80),
    apiCompleteness: phaseResult("apiCompleteness", 80),
    ...overrides?.phases,
  },
  reference: { ...emptyReference(), ...overrides?.reference },
  summary: {
    totalIssues: 0,
    criticalCount: 0,
    warningCount: 0,
    suggestionCount: 0,
  },
  criticalIssues: [],
  warnings: [],
  suggestions: [],
  meta: {
    evaluatedAt: new Date().toISOString(),
    totalDurationMs: 100,
    estimateVersion: "0.2.0",
    evaluatedFiles: 10,
  },
  penalties: overrides?.penalties,
});

export const test_estimate_fix_advisor = (): void => {
  const empty = generateFixAdvisory(makeResult(), "/test");
  assert.equal(empty.items.length, 0);
  assert.equal(empty.totalPotentialGain, 0);
  assert.equal(empty.topFixes.length, 0);

  const logicIssue = makeIssue({ id: "logic-issue", severity: "critical" });
  const logicAdvice = generateFixAdvisory(
    makeResult({
      phases: {
        logicCompleteness: phaseResult("logicCompleteness", 60, [logicIssue]),
      },
    }),
    "/test",
  );
  assert.equal(logicAdvice.items.length, 1);
  assert.equal(logicAdvice.items[0].issueId, "logic-issue");
  assert.equal(logicAdvice.items[0].phase, "logicCompleteness");
  assert(logicAdvice.items[0].estimatedImpact > 0);
  assert.equal(logicAdvice.items[0].priority, 1);
  assert.equal(logicAdvice.items[0].source, "phase");

  const sorted = generateFixAdvisory(
    makeResult({
      phases: {
        logicCompleteness: phaseResult("logicCompleteness", 50, [
          makeIssue({ id: "critical", severity: "critical" }),
          makeIssue({ id: "suggestion", severity: "suggestion" }),
        ]),
      },
    }),
    "/test",
  );
  assert.equal(sorted.items[0].issueId, "critical");
  assert.equal(sorted.items[0].priority, 1);
  assert.equal(sorted.items[1].issueId, "suggestion");
  assert.equal(sorted.items[1].priority, 2);
  assert(sorted.items[0].estimatedImpact > sorted.items[1].estimatedImpact);

  const weighted = generateFixAdvisory(
    makeResult({
      phases: {
        logicCompleteness: phaseResult("logicCompleteness", 50, [
          makeIssue({ id: "logic" }),
        ]),
        documentQuality: phaseResult("documentQuality", 50, [
          makeIssue({ id: "doc" }),
        ]),
      },
    }),
    "/test",
  );
  const logic = weighted.items.find((item) => item.issueId === "logic");
  const doc = weighted.items.find((item) => item.issueId === "doc");
  assert(logic !== undefined && doc !== undefined);
  assert(logic.estimatedImpact > doc.estimatedImpact);

  const severity = generateFixAdvisory(
    makeResult({
      phases: {
        logicCompleteness: phaseResult("logicCompleteness", 50, [
          makeIssue({ id: "c", severity: "critical" }),
          makeIssue({ id: "s", severity: "suggestion" }),
        ]),
      },
    }),
    "/test",
  );
  const critical = severity.items.find((item) => item.issueId === "c");
  const suggestion = severity.items.find((item) => item.issueId === "s");
  assert(critical !== undefined && suggestion !== undefined);
  assert(critical.estimatedImpact > suggestion.estimatedImpact);

  const cappedGainResult = makeResult({
    phases: {
      logicCompleteness: phaseResult(
        "logicCompleteness",
        0,
        Array.from({ length: 50 }, (_, i) =>
          makeIssue({ id: `capped-${i}`, severity: "critical" }),
        ),
      ),
    },
  });
  cappedGainResult.totalScore = 70;
  assert(
    generateFixAdvisory(cappedGainResult, "/test").totalPotentialGain <= 30,
  );

  const gateAdvice = generateFixAdvisory(
    makeResult({
      phases: {
        gate: phaseResult("gate", 80, [
          makeIssue({ id: "gate", severity: "critical", code: "TS2339" }),
        ]),
      },
    }),
    "/test",
  );
  assert.equal(gateAdvice.items[0].phase, "gate");
  assert(gateAdvice.items[0].estimatedImpact > 0);

  const perfectAdvice = generateFixAdvisory(
    makeResult({
      phases: {
        logicCompleteness: phaseResult("logicCompleteness", 100, [
          makeIssue({ id: "perfect" }),
        ]),
      },
    }),
    "/test",
  );
  assert.equal(perfectAdvice.items[0].estimatedImpact, 0);

  const complexityIssue = makeIssue({
    id: "complexity",
    code: "C001",
    category: "complexity",
    severity: "warning",
    message: "High complexity",
  });
  const complexityAdvice = generateFixAdvisory(
    makeResult({
      reference: {
        complexity: {
          totalFunctions: 10,
          complexFunctions: 1,
          maxComplexity: 25,
          issues: [complexityIssue],
        },
      },
    }),
    "/test",
  );
  assert.equal(complexityAdvice.items[0].issueId, "complexity");
  assert.equal(complexityAdvice.items[0].source, "reference");
  assert.equal(complexityAdvice.items[0].phase, "quality");

  const duplicationAdvice = generateFixAdvisory(
    makeResult({
      reference: {
        duplication: {
          totalBlocks: 50,
          issues: [
            makeIssue({
              id: "duplication",
              code: "D001",
              category: "duplication",
              severity: "warning",
            }),
          ],
        },
      },
      penalties: {
        duplication: { amount: 4, blocks: 50 },
      },
    }),
    "/test",
  );
  const duplicate = duplicationAdvice.items.find(
    (item) => item.issueId === "duplication",
  );
  assert(duplicate !== undefined);
  assert.equal(duplicate.source, "reference");
  assert.equal(duplicate.estimatedImpact, 2.4);

  const namingAdvice = generateFixAdvisory(
    makeResult({
      reference: {
        naming: {
          totalIssues: 1,
          issues: [
            makeIssue({
              id: "naming",
              code: "N001",
              category: "naming",
              severity: "warning",
            }),
          ],
        },
      },
    }),
    "/test",
  );
  const naming = namingAdvice.items.find((item) => item.issueId === "naming");
  assert(naming !== undefined);
  assert.equal(naming.estimatedImpact, 0.1);

  const shared = makeIssue({ id: "shared" });
  const deduped = generateFixAdvisory(
    makeResult({
      phases: {
        logicCompleteness: phaseResult("logicCompleteness", 60, [shared]),
      },
      reference: {
        complexity: {
          totalFunctions: 5,
          complexFunctions: 1,
          maxComplexity: 20,
          issues: [shared],
        },
      },
    }),
    "/test",
  );
  const sharedMatches = deduped.items.filter(
    (item) => item.issueId === "shared",
  );
  assert.equal(sharedMatches.length, 1);
  assert.equal(sharedMatches[0].source, "phase");

  const penaltyRecovery = generateFixAdvisory(
    makeResult({
      penalties: {
        duplication: { amount: 3, blocks: 40 },
        jsdoc: { amount: 2, missing: 15, ratio: "45%" },
      },
    }),
    "/test",
  );
  assert.equal(penaltyRecovery.penaltyRecovery?.length, 2);
  assert.equal(penaltyRecovery.penaltyRecovery?.[0].type, "duplication");
  assert.equal(penaltyRecovery.penaltyRecovery?.[0].currentPenalty, 3);
  assert.equal(penaltyRecovery.penaltyRecovery?.[1].type, "jsdoc");
  assert.equal(
    generateFixAdvisory(makeResult(), "/test").penaltyRecovery,
    undefined,
  );

  assert.equal(
    generateFixAdvisory(
      makeResult({
        penalties: {
          warning: { amount: 5, ratio: "40%" },
          duplication: { amount: 3, blocks: 40 },
          jsdoc: { amount: 2, missing: 10, ratio: "50%" },
          schemaSync: { amount: 4, emptyTypes: 3, mismatchedProperties: 2 },
          suggestionOverflow: { amount: 2, count: 800 },
        },
      }),
      "/test",
    ).penaltyRecovery?.length,
    5,
  );

  const topFixes = generateFixAdvisory(
    makeResult({
      phases: {
        logicCompleteness: phaseResult(
          "logicCompleteness",
          30,
          Array.from({ length: 20 }, (_, i) => makeIssue({ id: `top-${i}` })),
        ),
      },
    }),
    "/test",
  );
  assert.equal(topFixes.topFixes.length, 10);
  assert.equal(topFixes.items.length, 20);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "autobe-fix-advisor-"));
  try {
    const testFile = path.join(tmpDir, "test.ts");
    fs.writeFileSync(
      testFile,
      Array.from({ length: 20 }, (_, i) => `// line ${i + 1}`).join("\n"),
    );

    const middleSnippet = generateFixAdvisory(
      makeResult({
        phases: {
          logicCompleteness: phaseResult("logicCompleteness", 50, [
            makeIssue({ location: { file: "test.ts", line: 10 } }),
          ]),
        },
      }),
      tmpDir,
    ).items[0].snippet;
    assert(middleSnippet !== undefined);
    assert.equal(middleSnippet.lines.length, 7);
    assert.equal(middleSnippet.lines[3].isTarget, true);
    assert.equal(middleSnippet.lines[3].lineNumber, 10);
    assert.equal(middleSnippet.language, "typescript");

    const startSnippet = generateFixAdvisory(
      makeResult({
        phases: {
          logicCompleteness: phaseResult("logicCompleteness", 50, [
            makeIssue({ location: { file: "test.ts", line: 1 } }),
          ]),
        },
      }),
      tmpDir,
    ).items[0].snippet;
    assert(startSnippet !== undefined);
    assert.equal(startSnippet.lines[0].lineNumber, 1);
    assert.equal(startSnippet.lines[0].isTarget, true);

    const endSnippet = generateFixAdvisory(
      makeResult({
        phases: {
          logicCompleteness: phaseResult("logicCompleteness", 50, [
            makeIssue({ location: { file: "test.ts", line: 20 } }),
          ]),
        },
      }),
      tmpDir,
    ).items[0].snippet;
    assert(endSnippet !== undefined);
    const lastLine = endSnippet.lines[endSnippet.lines.length - 1];
    assert.equal(lastLine.lineNumber, 20);
    assert.equal(lastLine.isTarget, true);

    assert.equal(
      generateFixAdvisory(
        makeResult({
          phases: {
            logicCompleteness: phaseResult("logicCompleteness", 50, [
              makeIssue({ location: { file: "nonexistent.ts", line: 5 } }),
            ]),
          },
        }),
        tmpDir,
      ).items[0].snippet,
      undefined,
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  assert.equal(
    generateFixAdvisory(
      makeResult({
        phases: {
          logicCompleteness: phaseResult("logicCompleteness", 50, [
            makeIssue({ location: undefined }),
          ]),
        },
      }),
      "/test",
    ).items[0].snippet,
    undefined,
  );
};
