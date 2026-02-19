import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult } from '../../types';
export declare class RequirementsCoverageEvaluator extends BaseEvaluator {
    readonly name = "RequirementsCoverageEvaluator";
    readonly phase: "requirementsCoverage";
    readonly description = "Evaluates requirements to implementation coverage";
    evaluate(context: EvaluationContext): Promise<PhaseResult>;
    private computeRequirementsScore;
}
//# sourceMappingURL=requirements-coverage.evaluator.d.ts.map