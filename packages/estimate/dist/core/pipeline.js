"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationPipeline = void 0;
const path = __importStar(require("path"));
const gate_1 = require("../evaluators/gate");
const quality_1 = require("../evaluators/quality");
const safety_1 = require("../evaluators/safety");
const scoring_1 = require("../evaluators/scoring");
const telemetry_1 = require("../telemetry");
const types_1 = require("../types");
const context_builder_1 = require("./context-builder");
const { version } = require("../../package.json");
const phaseStrategies = [
    {
        key: "documentQuality",
        label: "documentation",
        Evaluator: scoring_1.DocumentQualityEvaluator,
    },
    {
        key: "requirementsCoverage",
        label: "requirements coverage",
        Evaluator: scoring_1.RequirementsCoverageEvaluator,
    },
    {
        key: "testCoverage",
        label: "test coverage",
        Evaluator: scoring_1.TestCoverageEvaluator,
    },
    {
        key: "logicCompleteness",
        label: "incomplete implementations",
        Evaluator: scoring_1.LogicCompletenessEvaluator,
    },
    {
        key: "apiCompleteness",
        label: "API completeness",
        Evaluator: scoring_1.ApiCompletenessEvaluator,
    },
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
        this.log("Building evaluation context...");
        this.context = await (0, context_builder_1.buildContext)(input.inputPath);
        this.context.options = input.options;
        this.log(`Found ${this.context.files.typescript.length} TypeScript files`);
        this.log(`  - Controllers: ${this.context.files.controllers.length}`);
        this.log(`  - Providers: ${this.context.files.providers.length}`);
        this.log(`  - Structures: ${this.context.files.structures.length}`);
        this.log(`  - Tests: ${this.context.files.tests.length}`);
        this.log(`  - Prisma: ${this.context.files.prismaSchemas.length}`);
        // Langfuse trace (null if not configured)
        const trace = (0, telemetry_1.createEvalTrace)({
            model: path.basename(path.dirname(input.inputPath)),
            project: input.options?.project || path.basename(input.inputPath),
            inputPath: input.inputPath,
        });
        // ── Gate ──────────────────────────────────────────────
        this.log("\n[Gate] Running basic validation...");
        const gateSpan = trace
            ? (0, telemetry_1.startPhaseSpan)(trace, "gate", { runTests: !!input.options?.runTests })
            : null;
        const gateResult = await this.runGate(this.context, input);
        if (gateSpan)
            (0, telemetry_1.endPhaseSpan)(gateSpan, gateResult);
        if (!gateResult.passed && !input.options?.continueOnGateFailure) {
            this.log("Gate failed, stopping evaluation");
            const emptyPhases = Object.fromEntries(phaseStrategies.map((s) => [s.key, (0, types_1.createEmptyPhaseResult)(s.key)]));
            const result = this.buildResult(input, this.context, { gate: gateResult, ...emptyPhases }, this.createEmptyReference(), startTime);
            if (trace)
                (0, telemetry_1.recordScores)(trace, result);
            return result;
        }
        // ── Scoring phases ───────────────────────────────────
        this.log("\n[Scoring] Running evaluation phases...");
        const phaseResults = await Promise.all(phaseStrategies.map(async (strategy) => {
            const span = trace
                ? (0, telemetry_1.startPhaseSpan)(trace, strategy.key, { label: strategy.label })
                : null;
            const result = await this.runPhase(this.context, strategy);
            if (span)
                (0, telemetry_1.endPhaseSpan)(span, result);
            return result;
        }));
        const phases = {
            gate: gateResult,
            ...Object.fromEntries(phaseStrategies.map((s, i) => [s.key, phaseResults[i]])),
        };
        // ── Golden Set ───────────────────────────────────────
        if (input.options?.golden && input.options?.project) {
            const goldenResult = this.context.goldenResult;
            if (goldenResult) {
                phases.goldenSet = goldenResult;
                // Record golden set as a span too
                if (trace) {
                    const goldenSpan = (0, telemetry_1.startPhaseSpan)(trace, "goldenSet", {
                        project: input.options.project,
                    });
                    (0, telemetry_1.endPhaseSpan)(goldenSpan, goldenResult);
                }
            }
            else if (trace) {
                // Golden was requested but no result — mark as skipped
                const goldenSpan = (0, telemetry_1.startPhaseSpan)(trace, "goldenSet", {
                    project: input.options.project,
                });
                goldenSpan.end({ output: { skipped: true } });
            }
        }
        // ── Reference info ───────────────────────────────────
        this.log("\n[Reference] Collecting code quality metrics...");
        const reference = await this.collectReferenceInfo(this.context);
        const result = this.buildResult(input, this.context, phases, reference, startTime);
        // Record all scores on trace
        if (trace)
            (0, telemetry_1.recordScores)(trace, result);
        return result;
    }
    async runGate(context, input) {
        const issues = [];
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
        // Syntax check
        this.log("  - Checking syntax...");
        const syntaxResult = await new gate_1.SyntaxEvaluator().evaluate(context);
        issues.push(...syntaxResult.issues);
        const totalFiles = context.files.typescript.length;
        const filesWithErrors = syntaxResult.metrics?.filesWithErrors || 0;
        const errorRatio = filesWithErrors / totalFiles;
        if (errorRatio > types_1.GATE_ERROR_THRESHOLD) {
            return this.createGateFailure(issues, "syntax", startTime, {
                totalFiles,
                filesWithErrors,
                errorRatio: Math.round(errorRatio * 100),
                threshold: types_1.GATE_ERROR_THRESHOLD * 100,
            });
        }
        const syntaxPenalty = Math.round(errorRatio * 100 * types_1.GATE_PENALTY_PER_PERCENT);
        // Gate fail if too many syntax warnings (e.g., unresolved modules)
        const syntaxWarningCount = syntaxResult.issues.filter((i) => i.severity === "warning").length;
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
        const typeResult = await new gate_1.TypeEvaluator().evaluate(context);
        issues.push(...typeResult.issues);
        const typeIssueCount = typeResult.issues.filter((i) => i.severity === "critical" || i.severity === "warning").length;
        const typeWarningCount = typeResult.issues.filter((i) => i.severity === "warning").length;
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
        const prismaResult = await new gate_1.PrismaEvaluator().evaluate(context);
        issues.push(...prismaResult.issues);
        // Runtime check
        this.log("  - Starting server and running e2e tests...");
        if (input.options?.runTests) {
            const runtimeResult = await new gate_1.RuntimeEvaluator().evaluate(context);
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
        const typePenalty = Math.min(10, Math.round((typeWarningCount / totalFiles) * 10));
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
    async runPhase(context, strategy) {
        this.log(`  - Checking ${strategy.label}...`);
        const evaluator = new strategy.Evaluator();
        const result = await evaluator.evaluate(context);
        result.explanation = (0, types_1.generateExplanation)(result.issues, result.score);
        return result;
    }
    async collectReferenceInfo(context) {
        const referenceEvaluators = [
            {
                key: "complexity",
                Evaluator: quality_1.ComplexityEvaluator,
                label: "complexity",
            },
            {
                key: "duplication",
                Evaluator: quality_1.DuplicationEvaluator,
                label: "duplication",
            },
            { key: "naming", Evaluator: quality_1.NamingEvaluator, label: "naming" },
            { key: "jsdoc", Evaluator: quality_1.JsDocEvaluator, label: "JSDoc" },
            { key: "security", Evaluator: safety_1.SecurityEvaluator, label: "security" },
        ];
        const results = await Promise.all(referenceEvaluators.map(async ({ key, Evaluator, label }) => {
            this.log(`  - Analyzing ${label}...`);
            const result = await new Evaluator().evaluate(context);
            return { key, result };
        }));
        const resultMap = Object.fromEntries(results.map(({ key, result }) => [key, result]));
        const complexityResult = resultMap.complexity;
        const complexFunctions = complexityResult.issues.filter((i) => i.severity === "critical").length;
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
    createGateFailure(issues, failedAt, startTime, extra) {
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
    buildResult(input, context, phases, reference, startTime) {
        const scoringIssues = [
            phases.gate.issues,
            ...phaseStrategies.map((s) => phases[s.key].issues),
        ].flat();
        const issueMap = new Map();
        for (const issue of scoringIssues) {
            const key = `${issue.code}:${issue.location?.file || ""}:${issue.location?.line || ""}`;
            if (!issueMap.has(key)) {
                issueMap.set(key, issue);
            }
        }
        const uniqueIssues = [...issueMap.values()];
        const criticalIssues = uniqueIssues.filter((i) => i.severity === "critical");
        const warnings = uniqueIssues.filter((i) => i.severity === "warning");
        const suggestions = uniqueIssues.filter((i) => i.severity === "suggestion");
        let totalScore;
        let penalties;
        if (!phases.gate.passed) {
            totalScore = 0;
        }
        else {
            const raw = Math.round(phaseStrategies.reduce((sum, s) => sum + phases[s.key].score * types_1.PHASE_WEIGHTS[s.key], 0));
            const gatePenalty = phases.gate.metrics?.penalty || 0;
            totalScore = Math.max(0, raw - gatePenalty);
            const penaltyData = {};
            // Warning penalty: starts at 30%, max -20
            const totalFiles = context.files.typescript.length || 1;
            const warningRatio = warnings.length / totalFiles;
            if (warningRatio > 0.3) {
                const warningPenalty = Math.min(20, Math.round((warningRatio - 0.3) * 8));
                totalScore = Math.max(0, totalScore - warningPenalty);
                penaltyData.warning = {
                    amount: warningPenalty,
                    ratio: `${(warningRatio * 100).toFixed(0)}%`,
                };
                if (this.verbose) {
                    console.log(`  Warning penalty: -${warningPenalty} (${warnings.length} warnings / ${totalFiles} files = ${penaltyData.warning.ratio})`);
                }
            }
            // Duplication penalty
            if (reference.duplication.totalBlocks > 50) {
                const dupPenalty = Math.min(5, Math.round((reference.duplication.totalBlocks - 50) / 20));
                totalScore = Math.max(0, totalScore - dupPenalty);
                penaltyData.duplication = {
                    amount: dupPenalty,
                    blocks: reference.duplication.totalBlocks,
                };
                if (this.verbose) {
                    console.log(`  Duplication penalty: -${dupPenalty} (${reference.duplication.totalBlocks} blocks)`);
                }
            }
            // JSDoc penalty
            if (reference.jsdoc.totalMissing > 0) {
                const jsdocRatio = reference.jsdoc.totalMissing / (context.files.typescript.length || 1);
                if (jsdocRatio > 0.1) {
                    const jsdocPenalty = Math.min(5, Math.round(jsdocRatio * 5));
                    totalScore = Math.max(0, totalScore - jsdocPenalty);
                    penaltyData.jsdoc = {
                        amount: jsdocPenalty,
                        missing: reference.jsdoc.totalMissing,
                        ratio: `${(jsdocRatio * 100).toFixed(0)}%`,
                    };
                    if (this.verbose) {
                        console.log(`  JSDoc penalty: -${jsdocPenalty} (${reference.jsdoc.totalMissing} missing, ${penaltyData.jsdoc.ratio})`);
                    }
                }
            }
            penalties = Object.keys(penaltyData).length > 0 ? penaltyData : undefined;
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
            penalties,
        };
    }
    log(msg) {
        if (this.verbose)
            console.log(msg);
    }
}
exports.EvaluationPipeline = EvaluationPipeline;
//# sourceMappingURL=pipeline.js.map