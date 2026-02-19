import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult } from '../../types';
export declare class LogicCompletenessEvaluator extends BaseEvaluator {
    readonly name = "LogicCompletenessEvaluator";
    readonly phase: "logicCompleteness";
    readonly description = "Checks for incomplete implementations";
    private readonly INCOMPLETE_PATTERNS;
    evaluate(context: EvaluationContext): Promise<PhaseResult>;
    private analyzeFile;
}
//# sourceMappingURL=logic-completeness.evaluator.d.ts.map