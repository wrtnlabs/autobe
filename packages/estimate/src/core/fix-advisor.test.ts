import * as fs from "fs";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type {
  EvaluationResult,
  Issue,
  PhaseResult,
  ReferenceInfo,
} from "../types";
import { createEmptyPhaseResult } from "../types";
import { generateFixAdvisory } from "./fix-advisor";

function makeIssue(overrides?: Partial<Issue>): Issue {
  return {
    id: `test-${Math.random().toString(36).slice(2)}`,
    severity: "critical",
    category: "incomplete",
    code: "LOGIC001",
    message: "throw new Error('not implemented')",
    autoFixable: false,
    ...overrides,
  };
}

function phaseResult(
  phase: PhaseResult["phase"],
  score: number,
  issues: Issue[] = [],
): PhaseResult {
  return { ...createEmptyPhaseResult(phase), score, issues, passed: true };
}

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

function makeResult(
  overrides?: Partial<{
    phases: Partial<EvaluationResult.Phases>;
    reference: Partial<ReferenceInfo>;
    penalties: EvaluationResult["penalties"];
  }>,
): EvaluationResult {
  return {
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
  };
}

describe("generateFixAdvisory", () => {
  describe("basic behavior", () => {
    it("returns empty advisory when no issues", () => {
      const result = makeResult();
      const advisory = generateFixAdvisory(result, "/test");
      expect(advisory.items).toHaveLength(0);
      expect(advisory.totalPotentialGain).toBe(0);
      expect(advisory.topFixes).toHaveLength(0);
    });

    it("generates advice for issues in scoring phases", () => {
      const issue = makeIssue({ severity: "critical" });
      const result = makeResult({
        phases: {
          logicCompleteness: phaseResult("logicCompleteness", 60, [issue]),
        },
      });
      const advisory = generateFixAdvisory(result, "/test");
      expect(advisory.items).toHaveLength(1);
      expect(advisory.items[0].issueId).toBe(issue.id);
      expect(advisory.items[0].phase).toBe("logicCompleteness");
      expect(advisory.items[0].estimatedImpact).toBeGreaterThan(0);
      expect(advisory.items[0].priority).toBe(1);
      expect(advisory.items[0].source).toBe("phase");
    });

    it("sorts by impact descending and assigns priority", () => {
      const criticalIssue = makeIssue({ id: "c1", severity: "critical" });
      const suggestionIssue = makeIssue({ id: "s1", severity: "suggestion" });
      const result = makeResult({
        phases: {
          logicCompleteness: phaseResult("logicCompleteness", 50, [
            criticalIssue,
            suggestionIssue,
          ]),
        },
      });
      const advisory = generateFixAdvisory(result, "/test");
      expect(advisory.items).toHaveLength(2);
      expect(advisory.items[0].issueId).toBe("c1");
      expect(advisory.items[0].priority).toBe(1);
      expect(advisory.items[1].issueId).toBe("s1");
      expect(advisory.items[1].priority).toBe(2);
      expect(advisory.items[0].estimatedImpact).toBeGreaterThan(
        advisory.items[1].estimatedImpact,
      );
    });
  });

  describe("impact estimation", () => {
    it("higher weight phase → higher impact", () => {
      const issueLogic = makeIssue({ id: "logic" });
      const issueDoc = makeIssue({ id: "doc" });
      const result = makeResult({
        phases: {
          logicCompleteness: phaseResult("logicCompleteness", 50, [issueLogic]),
          documentQuality: phaseResult("documentQuality", 50, [issueDoc]),
        },
      });
      const advisory = generateFixAdvisory(result, "/test");
      const logicAdvice = advisory.items.find((a) => a.issueId === "logic")!;
      const docAdvice = advisory.items.find((a) => a.issueId === "doc")!;
      expect(logicAdvice.estimatedImpact).toBeGreaterThan(
        docAdvice.estimatedImpact,
      );
    });

    it("critical issues have more impact than suggestions", () => {
      const critical = makeIssue({ id: "c", severity: "critical" });
      const suggestion = makeIssue({ id: "s", severity: "suggestion" });
      const result = makeResult({
        phases: {
          logicCompleteness: phaseResult("logicCompleteness", 50, [
            critical,
            suggestion,
          ]),
        },
      });
      const advisory = generateFixAdvisory(result, "/test");
      const cAdvice = advisory.items.find((a) => a.issueId === "c")!;
      const sAdvice = advisory.items.find((a) => a.issueId === "s")!;
      expect(cAdvice.estimatedImpact).toBeGreaterThan(sAdvice.estimatedImpact);
    });

    it("totalPotentialGain is capped at (100 - totalScore)", () => {
      const issues = Array.from({ length: 50 }, (_, i) =>
        makeIssue({ id: `i${i}`, severity: "critical" }),
      );
      const result = makeResult({
        phases: {
          logicCompleteness: phaseResult("logicCompleteness", 0, issues),
        },
      });
      result.totalScore = 70;
      const advisory = generateFixAdvisory(result, "/test");
      expect(advisory.totalPotentialGain).toBeLessThanOrEqual(30);
    });

    it("gate issues get estimated impact", () => {
      const gateIssue = makeIssue({
        id: "g1",
        severity: "critical",
        code: "TS2339",
      });
      const result = makeResult({
        phases: {
          gate: phaseResult("gate", 80, [gateIssue]),
        },
      });
      const advisory = generateFixAdvisory(result, "/test");
      expect(advisory.items).toHaveLength(1);
      expect(advisory.items[0].phase).toBe("gate");
      expect(advisory.items[0].estimatedImpact).toBeGreaterThan(0);
    });

    it("perfect phase score → zero impact", () => {
      const issue = makeIssue({ id: "p1" });
      const result = makeResult({
        phases: {
          logicCompleteness: phaseResult("logicCompleteness", 100, [issue]),
        },
      });
      const advisory = generateFixAdvisory(result, "/test");
      expect(advisory.items[0].estimatedImpact).toBe(0);
    });
  });

  describe("reference evaluator issues", () => {
    it("includes complexity issues", () => {
      const complexIssue = makeIssue({
        id: "cx1",
        code: "C001",
        category: "complexity",
        severity: "warning",
        message: "High complexity",
      });
      const result = makeResult({
        reference: {
          complexity: {
            totalFunctions: 10,
            complexFunctions: 1,
            maxComplexity: 25,
            issues: [complexIssue],
          },
        },
      });
      const advisory = generateFixAdvisory(result, "/test");
      expect(advisory.items).toHaveLength(1);
      expect(advisory.items[0].issueId).toBe("cx1");
      expect(advisory.items[0].source).toBe("reference");
      expect(advisory.items[0].phase).toBe("quality");
    });

    it("includes duplication issues with penalty-based impact", () => {
      const dupIssue = makeIssue({
        id: "d1",
        code: "D001",
        category: "duplication",
        severity: "warning",
      });
      const result = makeResult({
        reference: {
          duplication: { totalBlocks: 50, issues: [dupIssue] },
        },
        penalties: {
          duplication: { amount: 4, blocks: 50 },
        },
      });
      const advisory = generateFixAdvisory(result, "/test");
      const advice = advisory.items.find((a) => a.issueId === "d1")!;
      expect(advice.source).toBe("reference");
      // Impact should be penalty-derived (4 points / 1 issue * 0.6 severity)
      expect(advice.estimatedImpact).toBe(2.4);
    });

    it("reference issues without penalty get minimal impact", () => {
      const namingIssue = makeIssue({
        id: "n1",
        code: "N001",
        category: "naming",
        severity: "warning",
      });
      const result = makeResult({
        reference: {
          naming: { totalIssues: 1, issues: [namingIssue] },
        },
      });
      const advisory = generateFixAdvisory(result, "/test");
      const advice = advisory.items.find((a) => a.issueId === "n1")!;
      expect(advice.estimatedImpact).toBe(0.1); // minimal: 0.1 * 0.6 = 0.06 → rounded to 0.1
    });

    it("does not duplicate issues that appear in both phases and reference", () => {
      const sharedIssue = makeIssue({ id: "shared1" });
      const result = makeResult({
        phases: {
          logicCompleteness: phaseResult("logicCompleteness", 60, [
            sharedIssue,
          ]),
        },
        reference: {
          complexity: {
            totalFunctions: 5,
            complexFunctions: 1,
            maxComplexity: 20,
            issues: [sharedIssue], // same id
          },
        },
      });
      const advisory = generateFixAdvisory(result, "/test");
      const matchingItems = advisory.items.filter(
        (a) => a.issueId === "shared1",
      );
      expect(matchingItems).toHaveLength(1);
      expect(matchingItems[0].source).toBe("phase"); // phase takes priority
    });
  });

  describe("penalty recovery", () => {
    it("includes penalty recovery when penalties exist", () => {
      const result = makeResult({
        penalties: {
          duplication: { amount: 3, blocks: 40 },
          jsdoc: { amount: 2, missing: 15, ratio: "45%" },
        },
      });
      const advisory = generateFixAdvisory(result, "/test");
      expect(advisory.penaltyRecovery).toBeDefined();
      expect(advisory.penaltyRecovery).toHaveLength(2);
      expect(advisory.penaltyRecovery![0].type).toBe("duplication");
      expect(advisory.penaltyRecovery![0].currentPenalty).toBe(3);
      expect(advisory.penaltyRecovery![1].type).toBe("jsdoc");
    });

    it("no penalty recovery when no penalties", () => {
      const result = makeResult();
      const advisory = generateFixAdvisory(result, "/test");
      expect(advisory.penaltyRecovery).toBeUndefined();
    });

    it("includes all 5 penalty types", () => {
      const result = makeResult({
        penalties: {
          warning: { amount: 5, ratio: "40%" },
          duplication: { amount: 3, blocks: 40 },
          jsdoc: { amount: 2, missing: 10, ratio: "50%" },
          schemaSync: { amount: 4, emptyTypes: 3, mismatchedProperties: 2 },
          suggestionOverflow: { amount: 2, count: 800 },
        },
      });
      const advisory = generateFixAdvisory(result, "/test");
      expect(advisory.penaltyRecovery).toHaveLength(5);
    });
  });

  describe("topFixes", () => {
    it("limits to top 10", () => {
      const issues = Array.from({ length: 20 }, (_, i) =>
        makeIssue({ id: `i${i}` }),
      );
      const result = makeResult({
        phases: {
          logicCompleteness: phaseResult("logicCompleteness", 30, issues),
        },
      });
      const advisory = generateFixAdvisory(result, "/test");
      expect(advisory.topFixes).toHaveLength(10);
      expect(advisory.items).toHaveLength(20);
    });
  });

  describe("code snippets", () => {
    const tmpDir = path.join(__dirname, "__test_tmp__");
    const testFile = path.join(tmpDir, "test.ts");

    beforeEach(() => {
      fs.mkdirSync(tmpDir, { recursive: true });
      const lines = Array.from({ length: 20 }, (_, i) => `// line ${i + 1}`);
      fs.writeFileSync(testFile, lines.join("\n"));
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it("extracts code snippet with context lines", () => {
      const issue = makeIssue({
        location: { file: "test.ts", line: 10 },
      });
      const result = makeResult({
        phases: {
          logicCompleteness: phaseResult("logicCompleteness", 50, [issue]),
        },
      });
      const advisory = generateFixAdvisory(result, tmpDir);
      const advice = advisory.items[0];
      expect(advice.snippet).toBeDefined();
      expect(advice.snippet!.lines).toHaveLength(7);
      expect(advice.snippet!.lines[3].isTarget).toBe(true);
      expect(advice.snippet!.lines[3].lineNumber).toBe(10);
      expect(advice.snippet!.language).toBe("typescript");
    });

    it("handles edge: line near start of file", () => {
      const issue = makeIssue({
        location: { file: "test.ts", line: 1 },
      });
      const result = makeResult({
        phases: {
          logicCompleteness: phaseResult("logicCompleteness", 50, [issue]),
        },
      });
      const advisory = generateFixAdvisory(result, tmpDir);
      const advice = advisory.items[0];
      expect(advice.snippet).toBeDefined();
      expect(advice.snippet!.lines[0].lineNumber).toBe(1);
      expect(advice.snippet!.lines[0].isTarget).toBe(true);
    });

    it("handles edge: line near end of file", () => {
      const issue = makeIssue({
        location: { file: "test.ts", line: 20 },
      });
      const result = makeResult({
        phases: {
          logicCompleteness: phaseResult("logicCompleteness", 50, [issue]),
        },
      });
      const advisory = generateFixAdvisory(result, tmpDir);
      const advice = advisory.items[0];
      expect(advice.snippet).toBeDefined();
      const lastLine = advice.snippet!.lines[advice.snippet!.lines.length - 1];
      expect(lastLine.lineNumber).toBe(20);
      expect(lastLine.isTarget).toBe(true);
    });

    it("returns no snippet when file not found", () => {
      const issue = makeIssue({
        location: { file: "nonexistent.ts", line: 5 },
      });
      const result = makeResult({
        phases: {
          logicCompleteness: phaseResult("logicCompleteness", 50, [issue]),
        },
      });
      const advisory = generateFixAdvisory(result, tmpDir);
      expect(advisory.items[0].snippet).toBeUndefined();
    });

    it("returns no snippet when no location", () => {
      const issue = makeIssue({ location: undefined });
      const result = makeResult({
        phases: {
          logicCompleteness: phaseResult("logicCompleteness", 50, [issue]),
        },
      });
      const advisory = generateFixAdvisory(result, "/test");
      expect(advisory.items[0].snippet).toBeUndefined();
    });
  });
});
