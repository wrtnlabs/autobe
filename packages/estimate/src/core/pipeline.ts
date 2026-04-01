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
  PerformanceEvaluator,
  SchemaSyncEvaluator,
} from "../evaluators/quality";
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
import {
  type IncrementalDiff,
  canReusePhase,
  computeDiff,
  loadCache,
  restorePhaseResult,
  saveCache,
} from "./incremental";

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

    // Incremental diff — used to skip unchanged phases
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
    // When incremental diff is available and doesn't require full eval,
    // skip phases whose file dependencies haven't changed.
    const canUseIncremental =
      diff !== null && !diff.requiresFullEval && cache?.phaseResults;

    this.log("\n[Scoring] Running evaluation phases...");
    const phaseResults = await Promise.all(
      phaseStrategies.map(async (strategy) => {
        // Try to reuse cached result if dependencies haven't changed
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

    // ── Contract Tests (auto-generated from swagger.json) ──
    const contractResult = this.context.contractResult;
    if (contractResult) {
      // Merge contract metrics into goldenSet if present,
      // otherwise use contract result as goldenSet phase
      if (phases.goldenSet) {
        // Append contract metrics to existing golden set
        phases.goldenSet.metrics = {
          ...phases.goldenSet.metrics,
          ...contractResult.metrics,
        };
        phases.goldenSet.issues.push(...contractResult.issues);
      } else if (input.options?.runTests) {
        // Use contract result as goldenSet when no hardcoded scenarios
        phases.goldenSet = contractResult;
      }

      if (trace && contractResult) {
        const contractSpan = startPhaseSpan(trace, "contractTest", {});
        endPhaseSpan(contractSpan, contractResult);
      }
    }

    // ── Reference info ───────────────────────────────────
    this.log("\n[Reference] Collecting code quality metrics...");
    const [reference, perfMetrics] = await Promise.all([
      this.collectReferenceInfo(this.context),
      new PerformanceEvaluator().collectMetrics(this.context),
    ]);

    const result = this.buildResult(
      input,
      this.context,
      phases,
      reference,
      startTime,
      {
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
    );

    // Record all scores on trace
    if (trace) recordScores(trace, result);

    // Save incremental cache for next run (including phase results)
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

    // Check for incomplete pipeline output (e.g., only prisma files, no NestJS code)
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
    if (typeCriticalCount > 0 && typeCriticalCount / totalFiles > 0.3) {
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

    // Prisma penalty: critical/warning issues from Prisma validation
    const prismaCriticalCount = prismaResult.issues.filter(
      (i) => i.severity === "critical",
    ).length;
    const prismaWarningCount = prismaResult.issues.filter(
      (i) => i.severity === "warning",
    ).length;
    const prismaPenalty = Math.min(
      40,
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

    // Final gate score combines syntax + type penalties
    // Exclude infrastructure warnings (SDK version mismatches, not model code issues)
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
    // Scale penalty by warning-to-file ratio:
    //   ratio < 0.1  → mild penalty (up to 10)
    //   ratio 0.1–1  → moderate penalty (up to 30)
    //   ratio > 1    → severe penalty (up to 50)
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
      jsdoc: { totalMissing: 0, totalApis: 0, issues: [] },
      schemaSync: {
        totalTypes: 0,
        emptyTypes: 0,
        mismatchedProperties: 0,
        issues: [],
      },
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
    performanceMetrics?: Record<string, number | string>,
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
      // H-1: Partial credit for gate failure based on severity
      const gateMetrics = phases.gate.metrics || {};
      const failedAt = gateMetrics.failedAt as string | undefined;
      if (
        failedAt === "no-source" ||
        failedAt === "no-nestjs-artifacts" ||
        failedAt === "runtime"
      ) {
        totalScore = 0; // completely broken — no code or server won't start
      } else {
        // Syntax/type failure: partial credit based on how many files are ok
        const errorRatio = (gateMetrics.errorRatio as number) || 50;
        totalScore = Math.min(
          30,
          Math.max(0, Math.round(30 * (1 - errorRatio / 100))),
        );
      }
    } else {
      // Calculate weighted score
      // When goldenSet is present, include it as a regular phase with its weight.
      // When absent, exclude it and normalize remaining weights to 1.0.
      const hasGoldenSet = !!phases.goldenSet;
      const activePhases = hasGoldenSet
        ? [
            ...phaseStrategies,
            { key: "goldenSet" as const, label: "Golden Set" },
          ]
        : phaseStrategies;

      const activeSum = activePhases.reduce(
        (sum, s) => sum + PHASE_WEIGHTS[s.key],
        0,
      );
      const normFactor = activeSum > 0 ? 1 / activeSum : 1;

      const safeScore = (v: number | undefined | null) => {
        const n = v ?? 0;
        return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
      };
      let rawScore = activePhases.reduce(
        (sum, s) =>
          sum +
          safeScore(phases[s.key]?.score) * PHASE_WEIGHTS[s.key] * normFactor,
        0,
      );
      // Apply gate as a soft multiplier with smooth interpolation.
      // Gate failed → raw multiplier (score/100).
      // Gate passed → linear ramp from 0.85 (at gate=0) to 1.0 (at gate=100).
      rawScore = Math.min(100, rawScore); // clamp before multiplier
      const rawGateMultiplier = (phases.gate.score ?? 100) / 100;
      // C-4: Softer gate multiplier — 0.85 at gate=0 to 1.0 at gate=100
      // (was 0.7 to 1.0, too aggressive — made A grade unreachable)
      const gateMultiplier = phases.gate.passed
        ? 0.85 + rawGateMultiplier * 0.15
        : rawGateMultiplier;
      totalScore = Math.max(0, Math.round(rawScore * gateMultiplier));

      const penaltyData: NonNullable<EvaluationResult["penalties"]> = {};

      // M-5: Calculate all penalties first, then apply proportionally to avoid order dependence
      const INFRA_WARNING_PATTERNS = [
        "NestiaSimulator",
        "PlainFetcher",
        "MyGlobal",
        "unsupported extension",
      ];
      const isGatePenalizedWarning = (w: Issue) =>
        /^TS\d+$/.test(w.code) || /^P\d+$/.test(w.code);
      const realWarnings = warnings.filter(
        (w) =>
          !INFRA_WARNING_PATTERNS.some((p) => w.message.includes(p)) &&
          !isGatePenalizedWarning(w),
      );
      const totalFiles = context.files.typescript.length || 1;

      // 1. Warning penalty (max 20)
      const warningRatio = realWarnings.length / totalFiles;
      const warningThreshold = Math.min(
        0.35,
        0.2 + Math.max(0, totalFiles - 50) * 0.001,
      );
      let rawWarningPenalty = 0;
      if (warningRatio > warningThreshold) {
        rawWarningPenalty = Math.min(
          20,
          Math.round((warningRatio - warningThreshold) * 8),
        );
      }

      // 2. Duplication penalty (max 5)
      const dupThreshold = Math.max(
        30,
        Math.min(80, Math.round(totalFiles * 0.5)),
      );
      let rawDupPenalty = 0;
      if (reference.duplication.totalBlocks > dupThreshold) {
        rawDupPenalty = Math.min(
          5,
          Math.round((reference.duplication.totalBlocks - dupThreshold) / 20),
        );
      }

      // 3. JSDoc penalty (max 5)
      let rawJsdocPenalty = 0;
      let jsdocRatio = 0;
      if (reference.jsdoc.totalMissing > 0) {
        const jsdocDenom =
          reference.jsdoc.totalApis || reference.jsdoc.totalMissing;
        jsdocRatio =
          jsdocDenom > 0 ? reference.jsdoc.totalMissing / jsdocDenom : 0;
        if (jsdocRatio > 0.3) {
          const normalizedRatio = Math.min(1, (jsdocRatio - 0.3) / 0.7);
          rawJsdocPenalty = Math.min(5, Math.round(normalizedRatio * 5));
        }
      }

      // 4. Schema sync penalty (max 10)
      let rawSyncPenalty = 0;
      // If no types exist at all, apply minimum penalty (missing schema)
      if (reference.schemaSync.totalTypes === 0) {
        rawSyncPenalty = 3;
      }
      const syncTotal = Math.max(reference.schemaSync.totalTypes, 10);
      const emptyRatio = reference.schemaSync.emptyTypes / syncTotal;
      const mismatchRatio =
        reference.schemaSync.mismatchedProperties / syncTotal;
      const emptyThreshold = Math.min(
        0.25,
        0.15 + Math.max(0, syncTotal - 30) * 0.001,
      );
      const mismatchThreshold = Math.min(
        0.15,
        0.05 + Math.max(0, syncTotal - 30) * 0.001,
      );
      if (emptyRatio > emptyThreshold) {
        rawSyncPenalty += Math.min(5, Math.round(emptyRatio * 10));
      }
      if (mismatchRatio > mismatchThreshold) {
        rawSyncPenalty += Math.min(5, Math.round(mismatchRatio * 10));
      }

      // 5. Suggestion overflow penalty (max 10)
      let rawSuggestionPenalty = 0;
      const suggestionCount = suggestions.length;
      const suggestionThreshold = Math.min(
        1000,
        500 + Math.max(0, totalFiles - 50) * 3,
      );
      if (suggestionCount > suggestionThreshold) {
        const suggestionDivisor = Math.min(
          400,
          150 + Math.max(0, totalFiles - 50) * 1.5,
        );
        rawSuggestionPenalty = Math.min(
          10,
          Math.round(
            (suggestionCount - suggestionThreshold) / suggestionDivisor,
          ),
        );
      }

      // Apply proportionally: cap total at 20 (C-4: reduced from 30)
      const rawPenalties = [
        rawWarningPenalty,
        rawDupPenalty,
        rawJsdocPenalty,
        rawSyncPenalty,
        rawSuggestionPenalty,
      ];
      const rawTotal = rawPenalties.reduce((s, p) => s + p, 0);
      const MAX_COMBINED_PENALTY = 20;
      const scale =
        rawTotal > MAX_COMBINED_PENALTY ? MAX_COMBINED_PENALTY / rawTotal : 1.0;

      // Round individual penalties for display, but use exact sum for effective total
      const warningPenalty = Math.round(rawWarningPenalty * scale);
      const dupPenalty = Math.round(rawDupPenalty * scale);
      const jsdocPenalty = Math.round(rawJsdocPenalty * scale);
      const syncPenalty = Math.round(rawSyncPenalty * scale);
      const suggestionPenalty = Math.round(rawSuggestionPenalty * scale);
      const effectivePenalty = Math.min(
        MAX_COMBINED_PENALTY,
        warningPenalty +
          dupPenalty +
          jsdocPenalty +
          syncPenalty +
          suggestionPenalty,
      );

      totalScore = Math.max(0, totalScore - effectivePenalty);

      if (warningPenalty > 0) {
        penaltyData.warning = {
          amount: warningPenalty,
          ratio: `${(warningRatio * 100).toFixed(0)}%`,
        };
      }
      if (dupPenalty > 0) {
        penaltyData.duplication = {
          amount: dupPenalty,
          blocks: reference.duplication.totalBlocks,
        };
      }
      if (jsdocPenalty > 0) {
        penaltyData.jsdoc = {
          amount: jsdocPenalty,
          missing: reference.jsdoc.totalMissing,
          ratio: `${(jsdocRatio * 100).toFixed(0)}%`,
        };
      }
      if (syncPenalty > 0) {
        penaltyData.schemaSync = {
          amount: syncPenalty,
          emptyTypes: reference.schemaSync.emptyTypes,
          mismatchedProperties: reference.schemaSync.mismatchedProperties,
        };
      }
      if (suggestionPenalty > 0) {
        penaltyData.suggestionOverflow = {
          amount: suggestionPenalty,
          count: suggestionCount,
        };
      }

      if (this.verbose && effectivePenalty > 0) {
        console.log(
          `  Penalties: -${effectivePenalty} (raw ${rawTotal}, cap ${MAX_COMBINED_PENALTY}, scale ${scale.toFixed(2)})`,
        );
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
      performanceMetrics,
    };
  }

  private log(msg: string): void {
    if (this.verbose) console.log(msg);
  }
}
