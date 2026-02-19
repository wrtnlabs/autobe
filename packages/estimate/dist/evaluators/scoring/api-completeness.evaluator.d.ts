import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult } from '../../types';
export declare class ApiCompletenessEvaluator extends BaseEvaluator {
    readonly name = "ApiCompletenessEvaluator";
    readonly phase: "apiCompleteness";
    readonly description = "Evaluates API implementation completeness";
    evaluate(context: EvaluationContext): Promise<PhaseResult>;
    private analyzeFile;
}
//# sourceMappingURL=api-completeness.evaluator.d.ts.map