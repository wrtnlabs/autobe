import {
  type PenaltyInput,
  calculatePenalties,
} from "@autobe/estimate/src/core/penalty";
import { MAX_COMBINED_PENALTY } from "@autobe/estimate/src/types";
import type { Issue, ReferenceInfo } from "@autobe/estimate/src/types";
import assert from "node:assert/strict";

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

const makeWarning = (message: string, code = "W001"): Issue =>
  ({ code, message, severity: "warning" }) as Issue;

const makeSuggestion = (message = "hint"): Issue =>
  ({ code: "S001", message, severity: "suggestion" }) as Issue;

const defaultInput = (overrides?: Partial<PenaltyInput>): PenaltyInput => ({
  warnings: [],
  suggestions: [],
  reference: emptyReference(),
  totalFiles: 100,
  ...overrides,
});

export const test_estimate_penalty = (): void => {
  const clean = calculatePenalties(defaultInput());
  assert.equal(clean.effectivePenalty, 0);
  assert.equal(clean.penalties, undefined);

  const belowWarningThreshold = calculatePenalties(
    defaultInput({
      warnings: Array.from({ length: 20 }, (_, i) => makeWarning(`warn ${i}`)),
    }),
  );
  assert.equal(belowWarningThreshold.effectivePenalty, 0);

  const warningPenalty = calculatePenalties(
    defaultInput({
      warnings: Array.from({ length: 40 }, (_, i) => makeWarning(`warn ${i}`)),
    }),
  );
  assert(warningPenalty.effectivePenalty > 0);
  assert(warningPenalty.penalties?.warning !== undefined);
  assert(warningPenalty.penalties.warning.amount > 0);

  assert.equal(
    calculatePenalties(
      defaultInput({
        warnings: Array.from({ length: 50 }, () =>
          makeWarning("NestiaSimulator issue"),
        ),
      }),
    ).effectivePenalty,
    0,
  );
  assert.equal(
    calculatePenalties(
      defaultInput({
        warnings: Array.from({ length: 50 }, (_, i) =>
          makeWarning(`Type error ${i}`, "TS2339"),
        ),
      }),
    ).effectivePenalty,
    0,
  );
  assert(
    calculatePenalties(
      defaultInput({
        warnings: Array.from({ length: 500 }, (_, i) =>
          makeWarning(`warn ${i}`),
        ),
        totalFiles: 10,
      }),
    ).effectivePenalty <= MAX_COMBINED_PENALTY,
  );

  const duplicateClean = emptyReference();
  duplicateClean.duplication.totalBlocks = 25;
  assert.equal(
    calculatePenalties(defaultInput({ reference: duplicateClean })).penalties
      ?.duplication,
    undefined,
  );

  const duplicateDirty = emptyReference();
  duplicateDirty.duplication.totalBlocks = 80;
  const duplicatePenalty = calculatePenalties(
    defaultInput({ reference: duplicateDirty }),
  );
  assert.equal(duplicatePenalty.penalties?.duplication?.blocks, 80);

  const jsdocClean = emptyReference();
  jsdocClean.jsdoc = { totalMissing: 2, totalApis: 10, issues: [] };
  assert.equal(
    calculatePenalties(defaultInput({ reference: jsdocClean })).penalties
      ?.jsdoc,
    undefined,
  );

  const jsdocDirty = emptyReference();
  jsdocDirty.jsdoc = { totalMissing: 8, totalApis: 10, issues: [] };
  const jsdocPenalty = calculatePenalties(
    defaultInput({ reference: jsdocDirty }),
  );
  assert(jsdocPenalty.penalties?.jsdoc !== undefined);
  assert(jsdocPenalty.penalties.jsdoc.amount > 0);

  const jsdocZero = emptyReference();
  jsdocZero.jsdoc = { totalMissing: 0, totalApis: 10, issues: [] };
  assert.equal(
    calculatePenalties(defaultInput({ reference: jsdocZero })).penalties?.jsdoc,
    undefined,
  );

  const noTypes = emptyReference();
  noTypes.schemaSync = {
    totalTypes: 0,
    emptyTypes: 0,
    mismatchedProperties: 0,
    issues: [],
  };
  const noTypesPenalty = calculatePenalties(
    defaultInput({ reference: noTypes }),
  );
  assert.equal(noTypesPenalty.effectivePenalty, 3);
  assert.equal(noTypesPenalty.penalties?.schemaSync?.amount, 3);

  const emptyTypes = emptyReference();
  emptyTypes.schemaSync = {
    totalTypes: 20,
    emptyTypes: 5,
    mismatchedProperties: 0,
    issues: [],
  };
  assert(
    calculatePenalties(defaultInput({ reference: emptyTypes })).penalties
      ?.schemaSync !== undefined,
  );

  const mismatchedTypes = emptyReference();
  mismatchedTypes.schemaSync = {
    totalTypes: 20,
    emptyTypes: 0,
    mismatchedProperties: 3,
    issues: [],
  };
  assert(
    calculatePenalties(defaultInput({ reference: mismatchedTypes })).penalties
      ?.schemaSync !== undefined,
  );

  assert.equal(
    calculatePenalties(
      defaultInput({
        suggestions: Array.from({ length: 600 }, () => makeSuggestion()),
      }),
    ).penalties?.suggestionOverflow,
    undefined,
  );
  const suggestionPenalty = calculatePenalties(
    defaultInput({
      suggestions: Array.from({ length: 1000 }, () => makeSuggestion()),
    }),
  );
  assert.equal(suggestionPenalty.penalties?.suggestionOverflow?.count, 1000);

  const cappedReference = emptyReference();
  cappedReference.duplication.totalBlocks = 200;
  cappedReference.jsdoc = { totalMissing: 10, totalApis: 10, issues: [] };
  cappedReference.schemaSync = {
    totalTypes: 0,
    emptyTypes: 10,
    mismatchedProperties: 10,
    issues: [],
  };
  const capped = calculatePenalties(
    defaultInput({
      warnings: Array.from({ length: 300 }, (_, i) => makeWarning(`warn ${i}`)),
      suggestions: Array.from({ length: 3000 }, () => makeSuggestion()),
      reference: cappedReference,
      totalFiles: 50,
    }),
  );
  assert(capped.effectivePenalty <= MAX_COMBINED_PENALTY);

  assert.equal(
    calculatePenalties(defaultInput({ reference: noTypes })).effectivePenalty,
    3,
  );
  assert.equal(
    calculatePenalties(defaultInput({ totalFiles: 0 })).effectivePenalty,
    0,
  );
};
