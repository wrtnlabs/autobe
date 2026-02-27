import type { EvaluationContext, PhaseResult } from "../../types";
import { BaseEvaluator } from "../base";
export declare class LogicCompletenessEvaluator extends BaseEvaluator {
    readonly name = "LogicCompletenessEvaluator";
    readonly phase: "logicCompleteness";
    readonly description = "Checks for incomplete implementations";
    private readonly INCOMPLETE_PATTERNS;
    evaluate(context: EvaluationContext): Promise<PhaseResult>;
    private analyzeFile;
    /** Detect empty method bodies: async methodName(...) { } */
    private checkEmptyMethods;
    /** Detect empty catch blocks: catch (...) { } */
    private checkEmptyCatch;
    /** Detect stub return values: return {} or return [] as only statement */
    private checkStubReturns;
}
//# sourceMappingURL=logic-completeness.evaluator.d.ts.map