import {
  ComplexityEvaluator,
  DuplicationEvaluator,
  JsDocEvaluator,
  NamingEvaluator,
  SchemaSyncEvaluator,
} from "../evaluators/quality";
import type { EvaluationContext, Issue, ReferenceInfo } from "../types";

const referenceEvaluators = [
  { key: "complexity", Evaluator: ComplexityEvaluator, label: "complexity" },
  { key: "duplication", Evaluator: DuplicationEvaluator, label: "duplication" },
  { key: "naming", Evaluator: NamingEvaluator, label: "naming" },
  { key: "jsdoc", Evaluator: JsDocEvaluator, label: "JSDoc" },
  { key: "schemaSync", Evaluator: SchemaSyncEvaluator, label: "schema sync" },
] as const;

/** Run all reference evaluators in parallel and assemble a ReferenceInfo result. */
export async function collectReferenceInfo(
  context: EvaluationContext,
  log: (msg: string) => void = () => {},
): Promise<ReferenceInfo> {
  const results = await Promise.all(
    referenceEvaluators.map(async ({ key, Evaluator, label }) => {
      log(`  - Analyzing ${label}...`);
      const result = await new Evaluator().evaluate(context);
      return { key, result };
    }),
  );

  const resultMap = Object.fromEntries(
    results.map(({ key, result }) => [key, result]),
  );

  const complexityResult = resultMap.complexity;
  const complexFunctions = complexityResult.issues.filter(
    (i: Issue) => i.severity === "critical",
  ).length;
  const maxComplexity =
    (complexityResult.metrics?.maxComplexity as number) || 0;

  return {
    complexity: {
      totalFunctions: (complexityResult.metrics?.totalFunctions as number) || 0,
      complexFunctions,
      maxComplexity,
      issues: complexityResult.issues,
    },
    duplication: {
      totalBlocks: resultMap.duplication.issues.length,
      issues: resultMap.duplication.issues,
    },
    naming: {
      totalIssues: resultMap.naming.issues.length,
      issues: resultMap.naming.issues,
    },
    jsdoc: {
      totalMissing: resultMap.jsdoc.issues.length,
      totalApis: (resultMap.jsdoc.metrics?.totalPublicApis as number) || 0,
      issues: resultMap.jsdoc.issues,
    },
    schemaSync: {
      totalTypes: (resultMap.schemaSync.metrics?.totalTypes as number) || 0,
      emptyTypes: (resultMap.schemaSync.metrics?.emptyTypes as number) || 0,
      mismatchedProperties:
        (resultMap.schemaSync.metrics?.mismatchedProperties as number) || 0,
      issues: resultMap.schemaSync.issues,
    },
  };
}

/** Create a zero-initialized ReferenceInfo for gate failure scenarios. */
export function createEmptyReference(): ReferenceInfo {
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
      totalTypes: 0,
      emptyTypes: 0,
      mismatchedProperties: 0,
      issues: [],
    },
  };
}
