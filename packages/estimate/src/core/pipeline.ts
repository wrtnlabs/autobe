// Gate evaluators
import {
  PrismaEvaluator,
  SyntaxEvaluator,
  TypeEvaluator,
} from "../evaluators/gate";
// Reference evaluators (no score impact)
import {
  ComplexityEvaluator,
  DuplicationEvaluator,
  JsDocEvaluator,
  NamingEvaluator,
} from "../evaluators/quality";
import { SecurityEvaluator } from "../evaluators/safety";
// New scoring evaluators
import {
  ApiCompletenessEvaluator,
  DocumentQualityEvaluator,
  LogicCompletenessEvaluator,
  RequirementsCoverageEvaluator,
  TestCoverageEvaluator,
} from "../evaluators/scoring";
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
  generateExplanation,
  scoreToGrade,
} from "../types";
import { buildContext } from "./context-builder";

const { version } = require("../../package.json");

// Phase strategy definitions
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

    this.log(`Found ${this.context.files.typescript.length} TypeScript files`);
    this.log(`  - Controllers: ${this.context.files.controllers.length}`);
    this.log(`  - Providers: ${this.context.files.providers.length}`);
    this.log(`  - Structures: ${this.context.files.structures.length}`);
    this.log(`  - Tests: ${this.context.files.tests.length}`);
    this.log(`  - Prisma: ${this.context.files.prismaSchemas.length}`);

    // Phase 0: Gate
    this.log("\n[Gate] Running basic validation...");
    const gateResult = await this.runGate(this.context);

    if (!gateResult.passed && !input.options?.continueOnGateFailure) {
      this.log("Gate failed, stopping evaluation");
      const emptyPhases = Object.fromEntries(
        phaseStrategies.map((s) => [s.key, createEmptyPhaseResult(s.key)]),
      ) as Record<PhaseKey, PhaseResult>;

      return this.buildResult(
        input,
        this.context,
        {
          gate: gateResult,
          ...emptyPhases,
        },
        this.createEmptyReference(),
        startTime,
      );
    }

    // Run all scoring phases in parallel using strategy pattern
    this.log("\n[Scoring] Running evaluation phases...");
    const phaseResults = await Promise.all(
      phaseStrategies.map((strategy) => this.runPhase(this.context!, strategy)),
    );

    const phases = {
      gate: gateResult,
      ...Object.fromEntries(
        phaseStrategies.map((s, i) => [s.key, phaseResults[i]]),
      ),
    } as { gate: PhaseResult } & Record<PhaseKey, PhaseResult>;

    // Reference info (no score impact) - run in parallel
    this.log("\n[Reference] Collecting code quality metrics...");
    const reference = await this.collectReferenceInfo(this.context);

    return this.buildResult(input, this.context, phases, reference, startTime);
  }

  private async runGate(context: EvaluationContext): Promise<PhaseResult> {
    const issues: Issue[] = [];
    const startTime = performance.now();

    if (context.files.typescript.length === 0) {
      return {
        phase: "gate",
        passed: true,
        score: 100,
        maxScore: 100,
        weightedScore: 100,
        issues: [],
        durationMs: Math.round(performance.now() - startTime),
        metrics: { skipped: true, reason: "No TypeScript files found" },
      };
    }

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
    const penalty = Math.round(errorRatio * 100 * GATE_PENALTY_PER_PERCENT);
    const gateScore = Math.max(0, 100 - penalty);

    this.log(" -Checking types...");
    const typeResult = await new TypeEvaluator().evaluate(context);
    issues.push(...typeResult.issues);

    this.log(" -Validating Prisma schema...");
    const prismaResult = await new PrismaEvaluator().evaluate(context);
    issues.push(...prismaResult.issues);

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
        penalty,
        softPass: filesWithErrors > 0,
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
    ] as const;

    // Run all reference evaluators in parallel
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
    phases: { gate: PhaseResult } & Record<PhaseKey, PhaseResult>,
    reference: ReferenceInfo,
    startTime: number,
  ): EvaluationResult {
    const scoringIssues = [
      phases.gate.issues,
      ...phaseStrategies.map((s) => phases[s.key].issues),
    ].flat();
    // Deduplicate issues
    const issueMap = new Map<string, Issue>();
    for (const issue of scoringIssues) {
      const key = `${issue.code}:${issue.location?.file || ""}:${issue.location?.line || ""}`;
      if (!issueMap.has(key)) {
        issueMap.set(key, issue);
      }
    }
    const uniqueIssues = [...issueMap.values()];

    // Group by severity
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

      // Penalty tracking
      const penaltyData: NonNullable<EvaluationResult["penalties"]> = {};

      // Warning penalty
      const totalFiles = context.files.typescript.length || 1;
      const warningRatio = warnings.length / totalFiles;
      if (warningRatio > 0.5) {
        const warningPenalty = Math.min(
          10,
          Math.round((warningRatio - 0.5) * 5),
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
