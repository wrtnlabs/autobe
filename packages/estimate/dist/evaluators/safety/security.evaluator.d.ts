import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult } from '../../types';
export declare class SecurityEvaluator extends BaseEvaluator {
    readonly name = "SecurityEvaluator";
    readonly phase: "safety";
    readonly description = "Checks for security vulnerabilities";
    private readonly PATTERNS;
    evaluate(context: EvaluationContext): Promise<PhaseResult>;
    private analyzeFile;
    private isTestFile;
}
//# sourceMappingURL=security.evaluator.d.ts.map