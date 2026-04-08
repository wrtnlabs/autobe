import * as path from "path";

import {
  PrismaEvaluator,
  RuntimeEvaluator,
  SyntaxEvaluator,
  TypeEvaluator,
} from "../evaluators/gate";
import { PerformanceEvaluator } from "../evaluators/quality";
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
} from "../types";
import {
  GATE_ERROR_THRESHOLD,
  GATE_PENALTY_PER_PERCENT,
  PRISMA_PENALTY_CAP,
  TYPE_CRITICAL_RATIO,
  createEmptyPhaseResult,
  createIssue,
  generateExplanation,
} from "../types";
import { buildContext } from "./context-builder";
import {
  type IncrementalDiff,
  canReusePhase,
  computeDiff,
  loadCache,
  restorePhaseResult,
  saveCache,
} from "./incremental";
import {
  collectReferenceInfo,
  createEmptyReference,
} from "./reference-collector";
import { buildResult } from "./score-calculator";

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

    // Incremental diff
    const cache = loadCache(input.inputPath);
    let diff: IncrementalDiff | null = null;
    if (cache) {
      diff = computeDiff(this.context, cache);
      this.log(
        `\n[Incremental] ${diff.changed.length} changed, ${diff.added.length} added, ${diff.removed.length} removed, ${diff.unchangedCount} unchanged`,
      );
      if (diff.requiresFullEval) {
        this.log(
          "  → Full re-evaluation required (schema change or >30% changed)",
        );
      } else if (diff.changedCategories.size === 0) {
        this.log("  → No changes detected — will reuse cached phase results");
      } else {
        this.log(
          `  → Partial changes in: ${[...diff.changedCategories].join(", ")}`,
        );
      }
    } else {
      this.log("\n[Incremental] No cache found — full evaluation");
    }

    // Langfuse trace
    const trace = createEvalTrace({
      model: path.basename(path.dirname(input.inputPath)),
      project: input.options?.project || path.basename(input.inputPath),
      inputPath: input.inputPath,
    });
    setActiveTrace(trace);

    // Gate
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

      const result = buildResult({
        input,
        context: this.context,
        phases: { gate: gateResult, ...emptyPhases },
        reference: createEmptyReference(),
        startTime,
        verbose: this.verbose,
      });
      if (trace) recordScores(trace, result);
      return result;
    }

    // Scoring phases
    const canUseIncremental =
      diff !== null && !diff.requiresFullEval && cache?.phaseResults;

    this.log("\n[Scoring] Running evaluation phases...");
    const phaseResults = await Promise.all(
      phaseStrategies.map(async (strategy) => {
        if (canUseIncremental && diff && canReusePhase(strategy.key, diff)) {
          const cached = cache?.phaseResults?.[strategy.key];
          if (cached) {
            this.log(
              `  - ${strategy.label}: reusing cached result (score ${cached.score})`,
            );
            const restored = restorePhaseResult(cached);
            if (trace) {
              const span = startPhaseSpan(trace, strategy.key, {
                label: strategy.label,
                cached: true,
              });
              endPhaseSpan(span, restored);
            }
            return restored;
          }
        }

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

    // Golden Set
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

    // Contract Tests
    const contractResult = this.context.contractResult;
    if (contractResult) {
      if (phases.goldenSet) {
        phases.goldenSet.metrics = {
          ...phases.goldenSet.metrics,
          ...contractResult.metrics,
        };
        phases.goldenSet.issues.push(...contractResult.issues);
      } else if (input.options?.runTests) {
        phases.goldenSet = contractResult;
      }

      if (trace && contractResult) {
        const contractSpan = startPhaseSpan(trace, "contractTest", {});
        endPhaseSpan(contractSpan, contractResult);
      }
    }

    // Reference info
    this.log("\n[Reference] Collecting code quality metrics...");
    const [reference, perfMetrics] = await Promise.all([
      collectReferenceInfo(this.context, (msg) => this.log(msg)),
      new PerformanceEvaluator().collectMetrics(this.context),
    ]);

    const result = buildResult({
      input,
      context: this.context,
      phases,
      reference,
      startTime,
      verbose: this.verbose,
      performanceMetrics: {
        totalSizeKB: perfMetrics.totalSizeKB,
        totalFiles: perfMetrics.totalFiles,
        totalLines: perfMetrics.totalLines,
        avgLinesPerFile: perfMetrics.avgLinesPerFile,
        largestFile: perfMetrics.largestFile?.file ?? "N/A",
        largestFileSizeKB: perfMetrics.largestFile
          ? Math.round(perfMetrics.largestFile.sizeBytes / 1024)
          : 0,
        controllers: perfMetrics.fileCounts.controllers,
        providers: perfMetrics.fileCounts.providers,
        structures: perfMetrics.fileCounts.structures,
        tests: perfMetrics.fileCounts.tests,
      },
    });

    if (trace) recordScores(trace, result);

    // Save incremental cache
    const phaseResultMap: Record<string, PhaseResult> = {};
    for (const [i, strategy] of phaseStrategies.entries()) {
      phaseResultMap[strategy.key] = phaseResults[i];
    }
    saveCache(this.context, phaseResultMap);

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

    if (
      context.files.controllers.length === 0 &&
      context.files.providers.length === 0
    ) {
      return this.createGateFailure(
        [
          createIssue({
            code: "GATE002",
            severity: "critical",
            category: "syntax",
            message:
              "No controllers or providers found — pipeline output is incomplete (only infrastructure files exist)",
          }),
        ],
        "no-nestjs-artifacts",
        startTime,
        {
          reason: "No controllers or providers found",
          typescriptFiles: context.files.typescript.length,
        },
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

    // Type check
    this.log("  - Checking types...");
    const typeResult = await new TypeEvaluator().evaluate(context);
    issues.push(...typeResult.issues);

    const typeCriticalCount = typeResult.issues.filter(
      (i) => i.severity === "critical",
    ).length;
    if (
      typeCriticalCount > 0 &&
      typeCriticalCount / totalFiles > TYPE_CRITICAL_RATIO
    ) {
      return this.createGateFailure(issues, "type-errors", startTime, {
        totalFiles,
        filesWithErrors,
        typeCriticalCount,
        reason: `Too many critical type errors: ${typeCriticalCount} across ${totalFiles} files`,
      });
    }

    // Prisma check
    this.log("  - Validating Prisma schema...");
    const prismaResult = await new PrismaEvaluator().evaluate(context);
    issues.push(...prismaResult.issues);

    const prismaCriticalCount = prismaResult.issues.filter(
      (i) => i.severity === "critical",
    ).length;
    const prismaWarningCount = prismaResult.issues.filter(
      (i) => i.severity === "warning",
    ).length;
    const prismaPenalty = Math.min(
      PRISMA_PENALTY_CAP,
      prismaCriticalCount * 10 + prismaWarningCount * 2,
    );

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

    // Gate score
    const INFRA_PATTERNS = [
      "NestiaSimulator",
      "PlainFetcher",
      "MyGlobal",
      "unsupported extension",
    ];
    const isInfraWarning = (i: Issue) =>
      i.severity === "warning" &&
      INFRA_PATTERNS.some((p) => i.message.includes(p));
    const typeWarningCount = typeResult.issues.filter(
      (i) => i.severity === "warning" && !isInfraWarning(i),
    ).length;

    const warningRatio = totalFiles > 0 ? typeWarningCount / totalFiles : 0;
    const typePenalty =
      warningRatio <= 0.1
        ? Math.round(warningRatio * 100)
        : warningRatio <= 1
          ? Math.min(30, Math.round(10 + (warningRatio - 0.1) * 22))
          : Math.min(50, Math.round(30 + (warningRatio - 1) * 10));
    const totalPenalty = syntaxPenalty + typePenalty + prismaPenalty;
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
        typeCriticalCount,
        typeWarningCount,
        prismaCriticalCount,
        prismaWarningCount,
        softPass:
          filesWithErrors > 0 ||
          typeWarningCount > 0 ||
          prismaCriticalCount > 0,
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

  private log(msg: string): void {
    if (this.verbose) console.log(msg);
  }
}
