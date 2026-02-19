"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GateEvaluator = exports.BaseEvaluator = void 0;
/**
 * Base evaluator abstract class
 * All evaluators must extend this class
 */
class BaseEvaluator {
    /**
     * Time measurement wrapper
     */
    async measureTime(fn) {
        const start = performance.now();
        const result = await fn();
        const durationMs = Math.round(performance.now() - start);
        return { result, durationMs };
    }
    /**
     * Calculate score based on issues
     * - Critical: -20 points
     * - Warning: -5 points
     * - Suggestion: -1 point
     */
    calculateScore(issues, baseScore = 100) {
        let score = baseScore;
        for (const issue of issues) {
            switch (issue.severity) {
                case 'critical':
                    score -= 20;
                    break;
                case 'warning':
                    score -= 5;
                    break;
                case 'suggestion':
                    score -= 1;
                    break;
                default: {
                    const _exhaustiveCheck = issue.severity;
                    throw new Error(`Unknown severity: ${_exhaustiveCheck}`);
                }
            }
        }
        return Math.max(0, Math.min(100, score));
    }
    /**
     * Log output (for verbose mode)
     */
    log(message, verbose = false) {
        if (verbose) {
            console.log(`[${this.name}] ${message}`);
        }
    }
}
exports.BaseEvaluator = BaseEvaluator;
/**
 * Gate evaluator abstract class
 * Gate only determines pass/fail
 */
class GateEvaluator extends BaseEvaluator {
    phase = 'gate';
    async evaluate(context) {
        const { result, durationMs } = await this.measureTime(() => this.checkGate(context));
        return {
            phase: 'gate',
            passed: result.passed,
            score: result.passed ? 100 : 0,
            maxScore: 100,
            weightedScore: result.passed ? 100 : 0,
            issues: result.issues,
            durationMs,
            metrics: result.metrics,
        };
    }
}
exports.GateEvaluator = GateEvaluator;
//# sourceMappingURL=base.js.map