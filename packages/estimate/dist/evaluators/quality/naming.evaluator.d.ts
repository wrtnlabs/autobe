import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult } from '../../types';
export declare class NamingEvaluator extends BaseEvaluator {
    readonly name = "NamingEvaluator";
    readonly phase: "quality";
    readonly description = "Checks naming conventions";
    evaluate(context: EvaluationContext): Promise<PhaseResult>;
    private isTestFile;
    private analyzeFile;
    private isPascalCase;
}
//# sourceMappingURL=naming.evaluator.d.ts.map