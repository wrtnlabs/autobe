import type { EvaluationInput, EvaluationResult, EvaluationContext, PhaseResult, Issue, ReferenceInfo } from '../types';
const { version } = require("../../package.json");
import { scoreToGrade, createEmptyPhaseResult, generateExplanation, PHASE_WEIGHTS } from '../types';
import { buildContext } from './context-builder';

// Gate evaluators
import { SyntaxEvaluator, TypeEvaluator, PrismaEvaluator } from '../evaluators/gate';

// New scoring evaluators
import {
  DocumentQualityEvaluator,
  RequirementsCoverageEvaluator,
  TestCoverageEvaluator,
  LogicCompletenessEvaluator,
  ApiCompletenessEvaluator,
} from '../evaluators/scoring';

// Reference evaluators (no score impact)
import { ComplexityEvaluator, NamingEvaluator, JsDocEvaluator, DuplicationEvaluator } from '../evaluators/quality';
import { SecurityEvaluator } from '../evaluators/safety';

// Phase strategy definitions
const phaseStrategies = [
  { key: 'documentQuality', label: 'documentation', Evaluator: DocumentQualityEvaluator },
  { key: 'requirementsCoverage', label: 'requirements coverage', Evaluator: RequirementsCoverageEvaluator },
  { key: 'testCoverage', label: 'test coverage', Evaluator: TestCoverageEvaluator },
  { key: 'logicCompleteness', label: 'incomplete implementations', Evaluator: LogicCompletenessEvaluator },
  { key: 'apiCompleteness', label: 'API completeness', Evaluator: ApiCompletenessEvaluator },
] as const;

type PhaseKey = (typeof phaseStrategies)[number]['key'];

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
    this.log('Building evaluation context...');
    this.context = await buildContext(input.inputPath);

    this.log(`Found ${this.context.files.typescript.length} TypeScript files`);
    this.log(`  - Controllers: ${this.context.files.controllers.length}`);
    this.log(`  - Providers: ${this.context.files.providers.length}`);
    this.log(`  - Structures: ${this.context.files.structures.length}`);
    this.log(`  - Tests: ${this.context.files.tests.length}`);
    this.log(`  - Prisma: ${this.context.files.prismaSchemas.length}`);

    // Phase 0: Gate
    this.log('\n[Gate] Running basic validation...');
    const gateResult = await this.runGate(this.context);

    if (!gateResult.passed && !input.options?.continueOnGateFailure) {
      this.log('Gate failed, stopping evaluation');
      const emptyPhases = Object.fromEntries(
        phaseStrategies.map(s => [s.key, createEmptyPhaseResult(s.key)])
      ) as Record<PhaseKey, PhaseResult>;
      
      return this.buildResult(input, this.context, {
        gate: gateResult,
        ...emptyPhases,
      }, this.createEmptyReference(), startTime);
    }

    // Run all scoring phases in parallel using strategy pattern
    this.log('\n[Scoring] Running evaluation phases...');
    const phaseResults = await Promise.all(
      phaseStrategies.map(strategy => this.runPhase(this.context!, strategy))
    );

    const phases = {
      gate: gateResult,
      ...Object.fromEntries(
        phaseStrategies.map((s, i) => [s.key, phaseResults[i]])
      ),
    } as { gate: PhaseResult } & Record<PhaseKey, PhaseResult>;

    // Reference info (no score impact) - run in parallel
    this.log('\n[Reference] Collecting code quality metrics...');
    const reference = await this.collectReferenceInfo(this.context);

    return this.buildResult(input, this.context, phases, reference, startTime);
  }

  private async runGate(context: EvaluationContext): Promise<PhaseResult> {
    const issues: Issue[] = [];
    const startTime = performance.now();

    if (context.files.typescript.length === 0) {
      return {
        phase: 'gate',
        passed: true,
        score: 100,
        maxScore: 100,
        weightedScore: 100,
        issues: [],
        durationMs: Math.round(performance.now() - startTime),
        metrics: { skipped: true, reason: 'No TypeScript files found' },
      };
    }

    this.log('  - Checking syntax...');
    const syntaxResult = await new SyntaxEvaluator().evaluate(context);
    issues.push(...syntaxResult.issues);
    if (!syntaxResult.passed) {
      return this.createGateFailure(issues, 'syntax', startTime);
    }

    this.log('  - Checking types...');
    const typeResult = await new TypeEvaluator().evaluate(context);
    issues.push(...typeResult.issues);
    if (!typeResult.passed) {
      return this.createGateFailure(issues, 'type', startTime);
    }

    this.log('  - Validating Prisma schema...');
    const prismaResult = await new PrismaEvaluator().evaluate(context);
    issues.push(...prismaResult.issues);
    if (!prismaResult.passed) {
      return this.createGateFailure(issues, 'prisma', startTime);
    }

    return {
      phase: 'gate',
      passed: true,
      score: 100,
      maxScore: 100,
      weightedScore: 100,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: { allPassed: true },
    };
  }

  private async runPhase(
    context: EvaluationContext,
    strategy: (typeof phaseStrategies)[number]
  ): Promise<PhaseResult> {
    this.log(`  - Checking ${strategy.label}...`);
    const evaluator = new strategy.Evaluator();
    const result = await evaluator.evaluate(context);
    result.explanation = generateExplanation(result.issues, result.score);
    return result;
  }

  private async collectReferenceInfo(context: EvaluationContext): Promise<ReferenceInfo> {
    const referenceEvaluators = [
      { key: 'complexity', Evaluator: ComplexityEvaluator, label: 'complexity' },
      { key: 'duplication', Evaluator: DuplicationEvaluator, label: 'duplication' },
      { key: 'naming', Evaluator: NamingEvaluator, label: 'naming' },
      { key: 'jsdoc', Evaluator: JsDocEvaluator, label: 'JSDoc' },
      { key: 'security', Evaluator: SecurityEvaluator, label: 'security' },
    ] as const;

    // Run all reference evaluators in parallel
    const results = await Promise.all(
      referenceEvaluators.map(async ({ key, Evaluator, label }) => {
        this.log(`  - Analyzing ${label}...`);
        const result = await new Evaluator().evaluate(context);
        return { key, result };
      })
    );

    const resultMap = Object.fromEntries(
      results.map(({ key, result }) => [key, result])
    );

    const complexityResult = resultMap.complexity;
    const complexFunctions = complexityResult.issues.filter((i: Issue) => i.severity === 'critical').length;
    const maxComplexity = complexityResult.metrics?.maxComplexity as number || 0;

    return {
      complexity: {
        totalFunctions: complexityResult.metrics?.totalFunctions as number || 0,
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
      complexity: { totalFunctions: 0, complexFunctions: 0, maxComplexity: 0, issues: [] },
      duplication: { totalBlocks: 0, issues: [] },
      naming: { totalIssues: 0, issues: [] },
      jsdoc: { totalMissing: 0, issues: [] },
      security: { totalIssues: 0, issues: [] },
    };
  }

  private createGateFailure(issues: Issue[], failedAt: string, startTime: number): PhaseResult {
    return {
      phase: 'gate',
      passed: false,
      score: 0,
      maxScore: 100,
      weightedScore: 0,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: { failedAt },
    };
  }

  private buildResult(
    input: EvaluationInput,
    context: EvaluationContext,
    phases: { gate: PhaseResult } & Record<PhaseKey, PhaseResult>,
    reference: ReferenceInfo,
    startTime: number
  ): EvaluationResult {
    const scoringIssues = [
      phases.gate.issues,
      ...phaseStrategies.map(s => phases[s.key].issues),
    ].flat();
    // Deduplicate issues
    const issueMap = new Map<string, Issue>();
    for (const issue of scoringIssues) {
      const key = `${issue.code}:${issue.location?.file || ''}:${issue.location?.line || ''}`;
      if (!issueMap.has(key)) {
        issueMap.set(key, issue);
      }
    }
    const uniqueIssues = [...issueMap.values()];

    // Group by severity
    const criticalIssues = uniqueIssues.filter(i => i.severity === 'critical');
    const warnings = uniqueIssues.filter(i => i.severity === 'warning');
    const suggestions = uniqueIssues.filter(i => i.severity === 'suggestion');

    let totalScore: number;
    if (!phases.gate.passed) {
      totalScore = 0;
    } else {
      totalScore = Math.round(
        phaseStrategies.reduce((sum, s) => 
          sum + phases[s.key].score * PHASE_WEIGHTS[s.key], 0
        )
      );
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
    };
  }

  private log(msg: string): void {
    if (this.verbose) console.log(msg);
  }
}
