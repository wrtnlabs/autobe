"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationPipeline = void 0;
const { version } = require("../../package.json");
const types_1 = require("../types");
const context_builder_1 = require("./context-builder");
// Gate evaluators
const gate_1 = require("../evaluators/gate");
// New scoring evaluators
const scoring_1 = require("../evaluators/scoring");
// Reference evaluators (no score impact)
const quality_1 = require("../evaluators/quality");
const safety_1 = require("../evaluators/safety");
// Phase strategy definitions
const phaseStrategies = [
    { key: 'documentQuality', label: 'documentation', Evaluator: scoring_1.DocumentQualityEvaluator },
    { key: 'requirementsCoverage', label: 'requirements coverage', Evaluator: scoring_1.RequirementsCoverageEvaluator },
    { key: 'testCoverage', label: 'test coverage', Evaluator: scoring_1.TestCoverageEvaluator },
    { key: 'logicCompleteness', label: 'incomplete implementations', Evaluator: scoring_1.LogicCompletenessEvaluator },
    { key: 'apiCompleteness', label: 'API completeness', Evaluator: scoring_1.ApiCompletenessEvaluator },
];
class EvaluationPipeline {
    verbose;
    context = null;
    constructor(verbose = false) {
        this.verbose = verbose;
    }
    getContext() {
        return this.context;
    }
    async evaluate(input) {
        const startTime = performance.now();
        this.log('Building evaluation context...');
        this.context = await (0, context_builder_1.buildContext)(input.inputPath);
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
            const emptyPhases = Object.fromEntries(phaseStrategies.map(s => [s.key, (0, types_1.createEmptyPhaseResult)(s.key)]));
            return this.buildResult(input, this.context, {
                gate: gateResult,
                ...emptyPhases,
            }, this.createEmptyReference(), startTime);
        }
        // Run all scoring phases in parallel using strategy pattern
        this.log('\n[Scoring] Running evaluation phases...');
        const phaseResults = await Promise.all(phaseStrategies.map(strategy => this.runPhase(this.context, strategy)));
        const phases = {
            gate: gateResult,
            ...Object.fromEntries(phaseStrategies.map((s, i) => [s.key, phaseResults[i]])),
        };
        // Reference info (no score impact) - run in parallel
        this.log('\n[Reference] Collecting code quality metrics...');
        const reference = await this.collectReferenceInfo(this.context);
        return this.buildResult(input, this.context, phases, reference, startTime);
    }
    async runGate(context) {
        const issues = [];
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
        const syntaxResult = await new gate_1.SyntaxEvaluator().evaluate(context);
        issues.push(...syntaxResult.issues);
        if (!syntaxResult.passed) {
            return this.createGateFailure(issues, 'syntax', startTime);
        }
        this.log('  - Checking types...');
        const typeResult = await new gate_1.TypeEvaluator().evaluate(context);
        issues.push(...typeResult.issues);
        if (!typeResult.passed) {
            return this.createGateFailure(issues, 'type', startTime);
        }
        this.log('  - Validating Prisma schema...');
        const prismaResult = await new gate_1.PrismaEvaluator().evaluate(context);
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
    async runPhase(context, strategy) {
        this.log(`  - Checking ${strategy.label}...`);
        const evaluator = new strategy.Evaluator();
        const result = await evaluator.evaluate(context);
        result.explanation = (0, types_1.generateExplanation)(result.issues, result.score);
        return result;
    }
    async collectReferenceInfo(context) {
        const referenceEvaluators = [
            { key: 'complexity', Evaluator: quality_1.ComplexityEvaluator, label: 'complexity' },
            { key: 'duplication', Evaluator: quality_1.DuplicationEvaluator, label: 'duplication' },
            { key: 'naming', Evaluator: quality_1.NamingEvaluator, label: 'naming' },
            { key: 'jsdoc', Evaluator: quality_1.JsDocEvaluator, label: 'JSDoc' },
            { key: 'security', Evaluator: safety_1.SecurityEvaluator, label: 'security' },
        ];
        // Run all reference evaluators in parallel
        const results = await Promise.all(referenceEvaluators.map(async ({ key, Evaluator, label }) => {
            this.log(`  - Analyzing ${label}...`);
            const result = await new Evaluator().evaluate(context);
            return { key, result };
        }));
        const resultMap = Object.fromEntries(results.map(({ key, result }) => [key, result]));
        const complexityResult = resultMap.complexity;
        const complexFunctions = complexityResult.issues.filter((i) => i.severity === 'critical').length;
        const maxComplexity = complexityResult.metrics?.maxComplexity || 0;
        return {
            complexity: {
                totalFunctions: complexityResult.metrics?.totalFunctions || 0,
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
    createEmptyReference() {
        return {
            complexity: { totalFunctions: 0, complexFunctions: 0, maxComplexity: 0, issues: [] },
            duplication: { totalBlocks: 0, issues: [] },
            naming: { totalIssues: 0, issues: [] },
            jsdoc: { totalMissing: 0, issues: [] },
            security: { totalIssues: 0, issues: [] },
        };
    }
    createGateFailure(issues, failedAt, startTime) {
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
    buildResult(input, context, phases, reference, startTime) {
        const scoringIssues = [
            phases.gate.issues,
            ...phaseStrategies.map(s => phases[s.key].issues),
        ].flat();
        // Deduplicate issues
        const issueMap = new Map();
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
        let totalScore;
        if (!phases.gate.passed) {
            totalScore = 0;
        }
        else {
            totalScore = Math.round(phaseStrategies.reduce((sum, s) => sum + phases[s.key].score * types_1.PHASE_WEIGHTS[s.key], 0));
        }
        return {
            targetPath: input.inputPath,
            totalScore,
            grade: (0, types_1.scoreToGrade)(totalScore),
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
    log(msg) {
        if (this.verbose)
            console.log(msg);
    }
}
exports.EvaluationPipeline = EvaluationPipeline;
//# sourceMappingURL=pipeline.js.map