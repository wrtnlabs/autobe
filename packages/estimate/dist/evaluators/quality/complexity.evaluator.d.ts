import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult } from '../../types';
export declare class ComplexityEvaluator extends BaseEvaluator {
    readonly name = "ComplexityEvaluator";
    readonly phase: "quality";
    readonly description = "Checks cyclomatic complexity of functions";
    private readonly MAX_COMPLEXITY;
    private readonly WARNING_COMPLEXITY;
    evaluate(context: EvaluationContext): Promise<PhaseResult>;
    private analyzeFile;
    private calculateComplexity;
    private getFunctionName;
    private countFunctions;
}
//# sourceMappingURL=complexity.evaluator.d.ts.map