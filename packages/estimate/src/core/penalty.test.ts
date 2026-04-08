import { describe, expect, it } from "vitest";

import { MAX_COMBINED_PENALTY } from "../types";
import type { Issue, ReferenceInfo } from "../types";
import { type PenaltyInput, calculatePenalties } from "./penalty";

/** Helper to create a minimal ReferenceInfo */
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

/** Helper to create a warning Issue */
function makeWarning(message: string, code = "W001"): Issue {
  return { code, message, severity: "warning" } as Issue;
}

/** Helper to create a suggestion Issue */
function makeSuggestion(message = "hint"): Issue {
  return { code: "S001", message, severity: "suggestion" } as Issue;
}

function defaultInput(overrides?: Partial<PenaltyInput>): PenaltyInput {
  return {
    warnings: [],
    suggestions: [],
    reference: emptyReference(),
    totalFiles: 100,
    ...overrides,
  };
}

describe("calculatePenalties", () => {
  describe("zero penalties", () => {
    it("returns 0 penalty when all inputs are clean", () => {
      const result = calculatePenalties(defaultInput());
      expect(result.effectivePenalty).toBe(0);
      expect(result.penalties).toBeUndefined();
    });
  });

  describe("warning penalty", () => {
    it("no penalty when warning ratio is below threshold", () => {
      // 100 files, threshold = 0.2 + (100-50)*0.001 = 0.25
      // 20 warnings / 100 files = 0.20 → below threshold
      const warnings = Array.from({ length: 20 }, (_, i) =>
        makeWarning(`warn ${i}`),
      );
      const result = calculatePenalties(defaultInput({ warnings }));
      expect(result.effectivePenalty).toBe(0);
    });

    it("applies penalty when warning ratio exceeds threshold", () => {
      // 100 files, threshold = 0.25
      // 40 warnings / 100 = 0.40 → excess 0.15 → penalty = round(0.15 * 8) = 1
      const warnings = Array.from({ length: 40 }, (_, i) =>
        makeWarning(`warn ${i}`),
      );
      const result = calculatePenalties(defaultInput({ warnings }));
      expect(result.effectivePenalty).toBeGreaterThan(0);
      expect(result.penalties?.warning).toBeDefined();
      expect(result.penalties!.warning!.amount).toBeGreaterThan(0);
    });

    it("filters out infra warning patterns", () => {
      const warnings = Array.from({ length: 50 }, () =>
        makeWarning("NestiaSimulator issue"),
      );
      const result = calculatePenalties(defaultInput({ warnings }));
      expect(result.effectivePenalty).toBe(0);
    });

    it("filters out gate-penalized warnings (TS/P codes)", () => {
      const warnings = Array.from({ length: 50 }, (_, i) =>
        makeWarning(`Type error ${i}`, "TS2339"),
      );
      const result = calculatePenalties(defaultInput({ warnings }));
      expect(result.effectivePenalty).toBe(0);
    });

    it("caps warning penalty at 20", () => {
      // Massive amount of warnings
      const warnings = Array.from({ length: 500 }, (_, i) =>
        makeWarning(`warn ${i}`),
      );
      const result = calculatePenalties(
        defaultInput({ warnings, totalFiles: 10 }),
      );
      // raw warning penalty capped at 20, and that's the only penalty
      expect(result.effectivePenalty).toBeLessThanOrEqual(MAX_COMBINED_PENALTY);
    });
  });

  describe("duplication penalty", () => {
    it("no penalty when blocks below threshold", () => {
      const ref = emptyReference();
      ref.duplication.totalBlocks = 25; // threshold = max(30, ...) = 30
      const result = calculatePenalties(defaultInput({ reference: ref }));
      expect(result.penalties?.duplication).toBeUndefined();
    });

    it("applies penalty when blocks exceed threshold", () => {
      const ref = emptyReference();
      ref.duplication.totalBlocks = 80; // threshold for 100 files = max(30, min(80, 50)) = 50
      const result = calculatePenalties(defaultInput({ reference: ref }));
      expect(result.penalties?.duplication).toBeDefined();
      expect(result.penalties!.duplication!.blocks).toBe(80);
    });
  });

  describe("jsdoc penalty", () => {
    it("no penalty when missing ratio is below 0.3", () => {
      const ref = emptyReference();
      ref.jsdoc = { totalMissing: 2, totalApis: 10, issues: [] };
      const result = calculatePenalties(defaultInput({ reference: ref }));
      expect(result.penalties?.jsdoc).toBeUndefined();
    });

    it("applies penalty when missing ratio exceeds 0.3", () => {
      const ref = emptyReference();
      ref.jsdoc = { totalMissing: 8, totalApis: 10, issues: [] }; // ratio = 0.8
      const result = calculatePenalties(defaultInput({ reference: ref }));
      expect(result.penalties?.jsdoc).toBeDefined();
      expect(result.penalties!.jsdoc!.amount).toBeGreaterThan(0);
    });

    it("no penalty when totalMissing is 0", () => {
      const ref = emptyReference();
      ref.jsdoc = { totalMissing: 0, totalApis: 10, issues: [] };
      const result = calculatePenalties(defaultInput({ reference: ref }));
      expect(result.penalties?.jsdoc).toBeUndefined();
    });
  });

  describe("schema sync penalty", () => {
    it("applies base penalty of 3 when totalTypes is 0", () => {
      const ref = emptyReference();
      ref.schemaSync = {
        totalTypes: 0,
        emptyTypes: 0,
        mismatchedProperties: 0,
        issues: [],
      };
      const result = calculatePenalties(defaultInput({ reference: ref }));
      expect(result.effectivePenalty).toBe(3);
      expect(result.penalties?.schemaSync?.amount).toBe(3);
    });

    it("adds empty ratio penalty when exceeding threshold", () => {
      const ref = emptyReference();
      // 20 types, emptyThreshold = min(0.25, 0.15 + 0) = 0.15
      // emptyRatio = 5/20 = 0.25 → exceeds 0.15 → penalty = min(5, round(0.25*10)) = 3
      ref.schemaSync = {
        totalTypes: 20,
        emptyTypes: 5,
        mismatchedProperties: 0,
        issues: [],
      };
      const result = calculatePenalties(defaultInput({ reference: ref }));
      expect(result.penalties?.schemaSync).toBeDefined();
    });

    it("adds mismatch ratio penalty when exceeding threshold", () => {
      const ref = emptyReference();
      // 20 types, mismatchThreshold = min(0.15, 0.05 + 0) = 0.05
      // mismatchRatio = 3/20 = 0.15 → exceeds 0.05 → penalty = min(5, round(0.15*10)) = 2
      ref.schemaSync = {
        totalTypes: 20,
        emptyTypes: 0,
        mismatchedProperties: 3,
        issues: [],
      };
      const result = calculatePenalties(defaultInput({ reference: ref }));
      expect(result.penalties?.schemaSync).toBeDefined();
    });
  });

  describe("suggestion overflow penalty", () => {
    it("no penalty when suggestions below threshold", () => {
      // 100 files → threshold = min(1000, 500 + 50*3) = 650
      const suggestions = Array.from({ length: 600 }, () => makeSuggestion());
      const result = calculatePenalties(defaultInput({ suggestions }));
      expect(result.penalties?.suggestionOverflow).toBeUndefined();
    });

    it("applies penalty when suggestions exceed threshold", () => {
      // 100 files → threshold = 650, divisor = min(400, 150 + 50*1.5) = 225
      // 1000 suggestions → excess 350 → penalty = round(350/225) = 2
      const suggestions = Array.from({ length: 1000 }, () => makeSuggestion());
      const result = calculatePenalties(defaultInput({ suggestions }));
      expect(result.penalties?.suggestionOverflow).toBeDefined();
      expect(result.penalties!.suggestionOverflow!.count).toBe(1000);
    });
  });

  describe("proportional scaling (cap)", () => {
    it("caps total penalty at MAX_COMBINED_PENALTY", () => {
      const ref = emptyReference();
      ref.duplication.totalBlocks = 200;
      ref.jsdoc = { totalMissing: 10, totalApis: 10, issues: [] };
      ref.schemaSync = {
        totalTypes: 0,
        emptyTypes: 10,
        mismatchedProperties: 10,
        issues: [],
      };

      const warnings = Array.from({ length: 300 }, (_, i) =>
        makeWarning(`warn ${i}`),
      );
      const suggestions = Array.from({ length: 3000 }, () => makeSuggestion());

      const result = calculatePenalties(
        defaultInput({ warnings, suggestions, reference: ref, totalFiles: 50 }),
      );
      expect(result.effectivePenalty).toBeLessThanOrEqual(MAX_COMBINED_PENALTY);
    });

    it("does not scale when raw total is within cap", () => {
      // Only a small schema sync penalty (totalTypes = 0 → base 3)
      const ref = emptyReference();
      ref.schemaSync = {
        totalTypes: 0,
        emptyTypes: 0,
        mismatchedProperties: 0,
        issues: [],
      };
      const result = calculatePenalties(defaultInput({ reference: ref }));
      // raw = 3, below MAX_COMBINED_PENALTY, no scaling
      expect(result.effectivePenalty).toBe(3);
    });
  });

  describe("totalFiles fallback", () => {
    it("defaults totalFiles to 1 when 0", () => {
      // Should not throw
      const result = calculatePenalties(defaultInput({ totalFiles: 0 }));
      expect(result.effectivePenalty).toBe(0);
    });
  });
});
