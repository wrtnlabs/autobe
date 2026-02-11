import type { EvaluationInput, EvaluationResult, EvaluationContext, PhaseResult, Issue, ReferenceInfo } from '../types';
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
      return this.buildResult(input, this.context, {
        gate: gateResult,
        documentQuality: createEmptyPhaseResult('documentQuality'),
        requirementsCoverage: createEmptyPhaseResult('requirementsCoverage'),
        testCoverage: createEmptyPhaseResult('testCoverage'),
        logicCompleteness: createEmptyPhaseResult('logicCompleteness'),
        apiCompleteness: createEmptyPhaseResult('apiCompleteness'),
      }, this.createEmptyReference(), startTime);
    }

    // New scoring phases
    this.log('\n[Document Quality] Evaluating documentation...');
    const docQualityResult = await this.runDocumentQuality(this.context);

    this.log('\n[Requirements Coverage] Evaluating requirements...');
    const reqCoverageResult = await this.runRequirementsCoverage(this.context);

    this.log('\n[Test Coverage] Evaluating test coverage...');
    const testCoverageResult = await this.runTestCoverage(this.context);

    this.log('\n[Logic Completeness] Checking for incomplete code...');
    const logicResult = await this.runLogicCompleteness(this.context);

    this.log('\n[API Completeness] Evaluating API implementation...');
    const apiResult = await this.runApiCompleteness(this.context);

    // Reference info (no score impact)
    this.log('\n[Reference] Collecting code quality metrics...');
    const reference = await this.collectReferenceInfo(this.context);

    return this.buildResult(input, this.context, {
      gate: gateResult,
      documentQuality: docQualityResult,
      requirementsCoverage: reqCoverageResult,
      testCoverage: testCoverageResult,
      logicCompleteness: logicResult,
      apiCompleteness: apiResult,
    }, reference, startTime);
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

  const phaseStrategies = [
    { key: 'documentQuality', label: 'documentation', Evaluator: DocumentQualityEvaluator },
    { key: 'requirementsCoverage', label: 'requirements coverage', Evaluator: RequirementsCoverageEvaluator },
    { key: 'testCoverage', label: 'test coverage', Evaluator: TestCoverageEvaluator },
    { key: 'logicCompleteness', label: 'incomplete implementations', Evaluator: LogicCompletenessEvaluator },
    { key: 'apiCompleteness', label: 'API completeness', Evaluator: ApiCompletenessEvaluator },
  ] as const;
  
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
    this.log('  - Analyzing complexity...');
    const complexityResult = await new ComplexityEvaluator().evaluate(context);

    this.log('  - Analyzing duplication...');
    const duplicationResult = await new DuplicationEvaluator().evaluate(context);

    this.log('  - Analyzing naming...');
    const namingResult = await new NamingEvaluator().evaluate(context);

    this.log('  - Analyzing JSDoc...');
    const jsdocResult = await new JsDocEvaluator().evaluate(context);

    this.log('  - Analyzing security...');
    const securityResult = await new SecurityEvaluator().evaluate(context);

    const complexFunctions = complexityResult.issues.filter(i => i.severity === 'critical').length;
    const maxComplexity = complexityResult.metrics?.maxComplexity as number || 0;

    return {
      complexity: {
        totalFunctions: complexityResult.metrics?.totalFunctions as number || 0,
        complexFunctions,
        maxComplexity,
        issues: complexityResult.issues,
      },
      duplication: {
        totalBlocks: duplicationResult.issues.length,
        issues: duplicationResult.issues,
      },
      naming: {
        totalIssues: namingResult.issues.length,
        issues: namingResult.issues,
      },
      jsdoc: {
        totalMissing: jsdocResult.issues.length,
        issues: jsdocResult.issues,
      },
      security: {
        totalIssues: securityResult.issues.length,
        issues: securityResult.issues,
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
    phases: {
      gate: PhaseResult;
      documentQuality: PhaseResult;
      requirementsCoverage: PhaseResult;
      testCoverage: PhaseResult;
      logicCompleteness: PhaseResult;
      apiCompleteness: PhaseResult;
    },
    reference: ReferenceInfo,
    startTime: number
  ): EvaluationResult {
    const scoringIssues = [
      ...phases.gate.issues,
      ...phases.documentQuality.issues,
      ...phases.requirementsCoverage.issues,
      ...phases.testCoverage.issues,
      ...phases.logicCompleteness.issues,
      ...phases.apiCompleteness.issues,
    ];

    // Deduplicate issues by key
    const uniqueIssues = this.deduplicateIssues(scoringIssues);

    const criticalIssues = uniqueIssues.filter(i => i.severity === 'critical');
    const warnings = uniqueIssues.filter(i => i.severity === 'warning');
    const suggestions = uniqueIssues.filter(i => i.severity === 'suggestion');

    let totalScore: number;
    if (!phases.gate.passed) {
      totalScore = 0;
    } else {
      totalScore = Math.round(
        phases.documentQuality.score * PHASE_WEIGHTS.documentQuality +
        phases.requirementsCoverage.score * PHASE_WEIGHTS.requirementsCoverage +
        phases.testCoverage.score * PHASE_WEIGHTS.testCoverage +
        phases.logicCompleteness.score * PHASE_WEIGHTS.logicCompleteness +
        phases.apiCompleteness.score * PHASE_WEIGHTS.apiCompleteness
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
        estimateVersion: '0.2.0',
        evaluatedFiles: context.files.typescript.length,
      },
    };
  }

  private deduplicateIssues(issues: Issue[]): Issue[] {
    const seen = new Map<string, Issue>();
    for (const issue of issues) {
      const key = `${issue.code}:${issue.location?.file || ''}:${issue.location?.line || ''}`;
      if (!seen.has(key)) {
        seen.set(key, issue);
      }
    }
    return Array.from(seen.values());
  }

  private log(msg: string): void {
    if (this.verbose) console.log(msg);
  }
}
