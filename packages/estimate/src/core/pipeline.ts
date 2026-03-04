import * as path from "path";

import {
  PrismaEvaluator,
  RuntimeEvaluator,
  SyntaxEvaluator,
  TypeEvaluator,
} from "../evaluators/gate";
import {
  ComplexityEvaluator,
  DuplicationEvaluator,
  JsDocEvaluator,
  NamingEvaluator,
  SchemaSyncEvaluator,
} from "../evaluators/quality";
import { SecurityEvaluator } from "../evaluators/safety";
import {
  ApiCompletenessEvaluator,
  DocumentQualityEvaluator,
  LogicCompletenessEvaluator,
  RequirementsCoverageEvaluator,
  TestCoverageEvaluator,
} from "../evaluators/scoring";
import {
  createEvalTrace,
  endPhaseSpan,
  recordScores,
  setActiveTrace,
  startPhaseSpan,
} from "../telemetry";
import type {
  EvaluationContext,
  EvaluationInput,
  EvaluationResult,
  Issue,
  PhaseResult,
  ReferenceInfo,
} from "../types";
import {
  GATE_ERROR_THRESHOLD,
  GATE_PENALTY_PER_PERCENT,
  PHASE_WEIGHTS,
  createEmptyPhaseResult,
  createIssue,
  generateExplanation,
  scoreToGrade,
} from "../types";
import { buildContext } from "./context-builder";

const { version } = require("../../package.json");

const phaseStrategies = [
  {
    key: "documentQuality",
    label: "documentation",
    Evaluator: DocumentQualityEvaluator,
  },
  {
    key: "requirementsCoverage",
    label: "requirements coverage",
    Evaluator: RequirementsCoverageEvaluator,
  },
  {
    key: "testCoverage",
    label: "test coverage",
    Evaluator: TestCoverageEvaluator,
  },
  {
    key: "logicCompleteness",
    label: "incomplete implementations",
    Evaluator: LogicCompletenessEvaluator,
  },
  {
    key: "apiCompleteness",
    label: "API completeness",
    Evaluator: ApiCompletenessEvaluator,
  },
] as const;

type PhaseKey = (typeof phaseStrategies)[number]["key"];

/** Assembled phase results — alias for EvaluationResult.Phases */
type EvaluationPhases = EvaluationResult.Phases;

export class EvaluationPipeline {
  private verbose: boolean;
  private context: EvaluationContext | null = null;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
  }

  getContext(): EvaluationContext | null {
    return this.context;
  }

  async evaluate(input: EvaluationInput): Promise<EvaluationResult> {
    const startTime = performance.now();
    this.log("Building evaluation context...");
    this.context = await buildContext(input.inputPath);
    this.context.options = input.options;

    this.log(`Found ${this.context.files.typescript.length} TypeScript files`);
    this.log(`  - Controllers: ${this.context.files.controllers.length}`);
    this.log(`  - Providers: ${this.context.files.providers.length}`);
    this.log(`  - Structures: ${this.context.files.structures.length}`);
    this.log(`  - Tests: ${this.context.files.tests.length}`);
    this.log(`  - Prisma: ${this.context.files.prismaSchemas.length}`);

    // Langfuse trace (null if not configured)
    const trace = createEvalTrace({
      model: path.basename(path.dirname(input.inputPath)),
      project: input.options?.project || path.basename(input.inputPath),
      inputPath: input.inputPath,
    });
    setActiveTrace(trace);

    // ── Gate ──────────────────────────────────────────────
    this.log("\n[Gate] Running basic validation...");
    const gateSpan = trace
      ? startPhaseSpan(trace, "gate", { runTests: !!input.options?.runTests })
      : null;
    const gateResult = await this.runGate(this.context, input);
    if (gateSpan) endPhaseSpan(gateSpan, gateResult);

    if (!gateResult.passed && !input.options?.continueOnGateFailure) {
      this.log("Gate failed, stopping evaluation");
      const emptyPhases = Object.fromEntries(
        phaseStrategies.map((s) => [s.key, createEmptyPhaseResult(s.key)]),
      ) as Record<PhaseKey, PhaseResult>;

      const result = this.buildResult(
        input,
        this.context,
        { gate: gateResult, ...emptyPhases },
        this.createEmptyReference(),
        startTime,
      );
      if (trace) recordScores(trace, result);
      return result;
    }

    // ── Scoring phases ───────────────────────────────────
    this.log("\n[Scoring] Running evaluation phases...");
    const phaseResults = await Promise.all(
      phaseStrategies.map(async (strategy) => {
        const span = trace
          ? startPhaseSpan(trace, strategy.key, { label: strategy.label })
          : null;
        const result = await this.runPhase(this.context!, strategy);
        if (span) endPhaseSpan(span, result);
        return result;
      }),
    );

    const phases = {
      gate: gateResult,
      ...Object.fromEntries(
        phaseStrategies.map((s, i) => [s.key, phaseResults[i]]),
      ),
    } as EvaluationPhases;

    // ── Golden Set ───────────────────────────────────────
    if (input.options?.golden && input.options?.project) {
      const goldenResult = this.context.goldenResult;
      if (goldenResult) {
        phases.goldenSet = goldenResult;
        if (trace) {
          const goldenSpan = startPhaseSpan(trace, "goldenSet", {
            project: input.options.project,
          });
          endPhaseSpan(goldenSpan, goldenResult);
        }
      } else if (trace) {
        const goldenSpan = startPhaseSpan(trace, "goldenSet", {
          project: input.options.project,
        });
        goldenSpan.end({ output: { skipped: true } });
      }
    }

    // ── Reference info ───────────────────────────────────
    this.log("\n[Reference] Collecting code quality metrics...");
    const reference = await this.collectReferenceInfo(this.context);

    const result = this.buildResult(
      input,
      this.context,
      phases,
      reference,
      startTime,
    );

    // Record all scores on trace
    if (trace) recordScores(trace, result);

    return result;
  }

  private async runGate(
    context: EvaluationContext,
    input: EvaluationInput,
  ): Promise<PhaseResult> {
    const issues: Issue[] = [];
    const startTime = performance.now();

    if (context.files.typescript.length === 0) {
      return this.createGateFailure(
        [
          createIssue({
            code: "GATE001",
            severity: "critical",
            category: "syntax",
            message:
              "No TypeScript files found in src/ — pipeline may not have generated code",
          }),
        ],
        "no-source",
        startTime,
        { reason: "No TypeScript files found" },
      );
    }

    // Syntax check
    this.log("  - Checking syntax...");
    const syntaxResult = await new SyntaxEvaluator().evaluate(context);
    issues.push(...syntaxResult.issues);

    const totalFiles = context.files.typescript.length;
    const filesWithErrors =
      (syntaxResult.metrics?.filesWithErrors as number) || 0;
    const errorRatio = filesWithErrors / totalFiles;

    if (errorRatio > GATE_ERROR_THRESHOLD) {
      return this.createGateFailure(issues, "syntax", startTime, {
        totalFiles,
        filesWithErrors,
        errorRatio: Math.round(errorRatio * 100),
        threshold: GATE_ERROR_THRESHOLD * 100,
      });
    }

    const syntaxPenalty = Math.round(
      errorRatio * 100 * GATE_PENALTY_PER_PERCENT,
    );

    // Gate fail if too many syntax warnings (e.g., unresolved modules)
    const syntaxWarningCount = syntaxResult.issues.filter(
      (i) => i.severity === "warning",
    ).length;
    if (syntaxWarningCount > 100 || syntaxWarningCount / totalFiles > 0.3) {
      return this.createGateFailure(issues, "syntax-warnings", startTime, {
        totalFiles,
        filesWithErrors,
        syntaxWarningCount,
        reason: `Too many syntax warnings: ${syntaxWarningCount} warnings across ${totalFiles} files`,
      });
    }

    // Type check
    this.log("  - Checking types...");
    const typeResult = await new TypeEvaluator().evaluate(context);
    issues.push(...typeResult.issues);

    const typeIssueCount = typeResult.issues.filter(
      (i) => i.severity === "critical" || i.severity === "warning",
    ).length;
    const typeWarningCount = typeResult.issues.filter(
      (i) => i.severity === "warning",
    ).length;
    if (typeIssueCount > 100 || typeWarningCount / totalFiles > 0.3) {
      return this.createGateFailure(issues, "type-errors", startTime, {
        totalFiles,
        filesWithErrors,
        typeErrorCount: typeIssueCount,
        typeWarningCount,
        reason: `Too many type errors: ${typeIssueCount} critical/warning (${typeWarningCount} warnings across ${totalFiles} files)`,
      });
    }

    // Prisma check
    this.log("  - Validating Prisma schema...");
    const prismaResult = await new PrismaEvaluator().evaluate(context);
    issues.push(...prismaResult.issues);

    // Runtime check
    this.log("  - Starting server and running e2e tests...");
    if (input.options?.runTests) {
      const runtimeResult = await new RuntimeEvaluator().evaluate(context);
      issues.push(...runtimeResult.issues);

      if (runtimeResult.metrics?.skipped) {
        this.log("  - Runtime skipped (docker-compose.yml not found)");
      }

      if (!runtimeResult.passed) {
        return this.createGateFailure(issues, "runtime", startTime, {
          serverStarted: false,
        });
      }
    }

    // Final gate score combines syntax + type penalties
    const typePenalty = Math.min(
      10,
      Math.round((typeWarningCount / totalFiles) * 10),
    );
    const totalPenalty = syntaxPenalty + typePenalty;
    const gateScore = Math.max(0, 100 - totalPenalty);

    return {
      phase: "gate",
      passed: true,
      score: gateScore,
      maxScore: 100,
      weightedScore: gateScore,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: {
        totalFiles,
        filesWithErrors,
        errorRatio: Math.round(errorRatio * 100),
        penalty: totalPenalty,
        typeErrorCount: typeIssueCount,
        typeWarningCount,
        softPass: filesWithErrors > 0 || typeWarningCount > 0,
      },
    };
  }

  private async runPhase(
    context: EvaluationContext,
    strategy: (typeof phaseStrategies)[number],
  ): Promise<PhaseResult> {
    this.log(`  - Checking ${strategy.label}...`);
    const evaluator = new strategy.Evaluator();
    const result = await evaluator.evaluate(context);
    result.explanation = generateExplanation(result.issues, result.score);
    return result;
  }

  private async collectReferenceInfo(
    context: EvaluationContext,
  ): Promise<ReferenceInfo> {
    const referenceEvaluators = [
      {
        key: "complexity",
        Evaluator: ComplexityEvaluator,
        label: "complexity",
      },
      {
        key: "duplication",
        Evaluator: DuplicationEvaluator,
        label: "duplication",
      },
      { key: "naming", Evaluator: NamingEvaluator, label: "naming" },
      { key: "jsdoc", Evaluator: JsDocEvaluator, label: "JSDoc" },
      { key: "security", Evaluator: SecurityEvaluator, label: "security" },
      {
        key: "schemaSync",
        Evaluator: SchemaSyncEvaluator,
        label: "schema sync",
      },
    ] as const;

    const results = await Promise.all(
      referenceEvaluators.map(async ({ key, Evaluator, label }) => {
        this.log(`  - Analyzing ${label}...`);
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
        totalFunctions:
          (complexityResult.metrics?.totalFunctions as number) || 0,
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
        issues: resultMap.jsdoc.issues,
      },
      security: {
        totalIssues: resultMap.security.issues.length,
        issues: resultMap.security.issues,
      },
      schemaSync: {
        totalTypes: (resultMap.schemaSync.metrics?.totalTypes as number) || 0,
        emptyTypes: (resultMap.schemaSync.metrics?.emptyTypes as number) || 0,
        issues: resultMap.schemaSync.issues,
      },
    };
  }

  private createEmptyReference(): ReferenceInfo {
    return {
      complexity: {
        totalFunctions: 0,
        complexFunctions: 0,
        maxComplexity: 0,
        issues: [],
      },
      duplication: { totalBlocks: 0, issues: [] },
      naming: { totalIssues: 0, issues: [] },
      jsdoc: { totalMissing: 0, issues: [] },
      security: { totalIssues: 0, issues: [] },
      schemaSync: { totalTypes: 0, emptyTypes: 0, issues: [] },
    };
  }

  private createGateFailure(
    issues: Issue[],
    failedAt: string,
    startTime: number,
    extra?: Record<string, number | string | boolean>,
  ): PhaseResult {
    return {
      phase: "gate",
      passed: false,
      score: 0,
      maxScore: 100,
      weightedScore: 0,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: { failedAt, ...extra },
    };
  }

  private buildResult(
    input: EvaluationInput,
    context: EvaluationContext,
    phases: EvaluationPhases,
    reference: ReferenceInfo,
    startTime: number,
  ): EvaluationResult {
    const scoringIssues = [
      phases.gate.issues,
      ...phaseStrategies.map((s) => phases[s.key].issues),
    ].flat();

    const issueMap = new Map<string, Issue>();
    for (const issue of scoringIssues) {
      const key = `${issue.code}:${issue.location?.file || ""}:${issue.location?.line || ""}`;
      if (!issueMap.has(key)) {
        issueMap.set(key, issue);
      }
    }
    const uniqueIssues = [...issueMap.values()];

    const criticalIssues = uniqueIssues.filter(
      (i) => i.severity === "critical",
    );
    const warnings = uniqueIssues.filter((i) => i.severity === "warning");
    const suggestions = uniqueIssues.filter((i) => i.severity === "suggestion");

    let totalScore: number;
    let penalties: EvaluationResult["penalties"];

    if (!phases.gate.passed) {
      totalScore = 0;
    } else {
      const raw = Math.round(
        phaseStrategies.reduce(
          (sum, s) => sum + phases[s.key].score * PHASE_WEIGHTS[s.key],
          0,
        ),
      );
      const gatePenalty = (phases.gate.metrics?.penalty as number) || 0;
      totalScore = Math.max(0, raw - gatePenalty);

      const penaltyData: NonNullable<EvaluationResult["penalties"]> = {};

      // Warning penalty: starts at 30%, max -20
      const totalFiles = context.files.typescript.length || 1;
      const warningRatio = warnings.length / totalFiles;
      if (warningRatio > 0.3) {
        const warningPenalty = Math.min(
          20,
          Math.round((warningRatio - 0.3) * 8),
        );
        totalScore = Math.max(0, totalScore - warningPenalty);
        penaltyData.warning = {
          amount: warningPenalty,
          ratio: `${(warningRatio * 100).toFixed(0)}%`,
        };
        if (this.verbose) {
          console.log(
            `  Warning penalty: -${warningPenalty} (${warnings.length} warnings / ${totalFiles} files = ${penaltyData.warning.ratio})`,
          );
        }
      }

      // Duplication penalty
      if (reference.duplication.totalBlocks > 50) {
        const dupPenalty = Math.min(
          5,
          Math.round((reference.duplication.totalBlocks - 50) / 20),
        );
        totalScore = Math.max(0, totalScore - dupPenalty);
        penaltyData.duplication = {
          amount: dupPenalty,
          blocks: reference.duplication.totalBlocks,
        };
        if (this.verbose) {
          console.log(
            `  Duplication penalty: -${dupPenalty} (${reference.duplication.totalBlocks} blocks)`,
          );
        }
      }

      // JSDoc penalty
      if (reference.jsdoc.totalMissing > 0) {
        const jsdocRatio =
          reference.jsdoc.totalMissing / (context.files.typescript.length || 1);
        if (jsdocRatio > 0.1) {
          const jsdocPenalty = Math.min(5, Math.round(jsdocRatio * 5));
          totalScore = Math.max(0, totalScore - jsdocPenalty);
          penaltyData.jsdoc = {
            amount: jsdocPenalty,
            missing: reference.jsdoc.totalMissing,
            ratio: `${(jsdocRatio * 100).toFixed(0)}%`,
          };
          if (this.verbose) {
            console.log(
              `  JSDoc penalty: -${jsdocPenalty} (${reference.jsdoc.totalMissing} missing, ${penaltyData.jsdoc.ratio})`,
            );
          }
        }
      }

      // Empty interface penalty
      if (reference.schemaSync.emptyTypes >= 5) {
        const syncPenalty = Math.min(
          5,
          Math.round(reference.schemaSync.emptyTypes / 10),
        );
        totalScore = Math.max(0, totalScore - syncPenalty);
        penaltyData.schemaSync = {
          amount: syncPenalty,
          emptyTypes: reference.schemaSync.emptyTypes,
        };
        if (this.verbose) {
          console.log(
            `  Schema sync penalty: -${syncPenalty} (${reference.schemaSync.emptyTypes} empty types)`,
          );
        }
      }

      penalties = Object.keys(penaltyData).length > 0 ? penaltyData : undefined;
    }

    return {
      targetPath: input.inputPath,
      totalScore,
      grade: scoreToGrade(totalScore),
      phases,
      reference,
      summary: {
        totalIssues: uniqueIssues.length,
        criticalCount: criticalIssues.length,
        warningCount: warnings.length,
        suggestionCount: suggestions.length,
      },
      criticalIssues,
      warnings,
      suggestions,
      meta: {
        evaluatedAt: new Date().toISOString(),
        totalDurationMs: Math.round(performance.now() - startTime),
        estimateVersion: version,
        evaluatedFiles: context.files.typescript.length,
      },
      penalties,
    };
  }

  private log(msg: string): void {
    if (this.verbose) console.log(msg);
  }
}
