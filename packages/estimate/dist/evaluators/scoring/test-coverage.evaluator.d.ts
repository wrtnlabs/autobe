import type { EvaluationContext, PhaseResult } from "../../types";
import { BaseEvaluator } from "../base";
export declare class TestCoverageEvaluator extends BaseEvaluator {
    readonly name = "TestCoverageEvaluator";
    readonly phase: "testCoverage";
    readonly description = "Evaluates test coverage";
    evaluate(context: EvaluationContext): Promise<PhaseResult>;
    private analyzeTestQuality;
    private computeCoverageScore;
    private evaluateFromRuntime;
}
//# sourceMappingURL=test-coverage.evaluator.d.ts.map