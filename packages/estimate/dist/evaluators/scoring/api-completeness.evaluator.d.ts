import type { EvaluationContext, PhaseResult } from "../../types";
import { BaseEvaluator } from "../base";
export declare class ApiCompletenessEvaluator extends BaseEvaluator {
    readonly name = "ApiCompletenessEvaluator";
    readonly phase: "apiCompleteness";
    readonly description = "Evaluates API implementation completeness";
    evaluate(context: EvaluationContext): Promise<PhaseResult>;
    private analyzeFile;
    /** Check if method body is a stub (returns empty/null) */
    private isStubBody;
}
//# sourceMappingURL=api-completeness.evaluator.d.ts.map