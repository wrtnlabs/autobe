import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult } from '../../types';
export declare class TestCoverageEvaluator extends BaseEvaluator {
    readonly name = "TestCoverageEvaluator";
    readonly phase: "testCoverage";
    readonly description = "Evaluates test coverage";
    evaluate(context: EvaluationContext): Promise<PhaseResult>;
    private computeCoverageScore;
}
//# sourceMappingURL=test-coverage.evaluator.d.ts.map