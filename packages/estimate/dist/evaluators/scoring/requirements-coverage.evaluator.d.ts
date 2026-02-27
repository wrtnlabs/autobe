import type { EvaluationContext, PhaseResult } from "../../types";
import { BaseEvaluator } from "../base";
export declare class RequirementsCoverageEvaluator extends BaseEvaluator {
    readonly name = "RequirementsCoverageEvaluator";
    readonly phase: "requirementsCoverage";
    readonly description = "Evaluates requirements to implementation coverage";
    evaluate(context: EvaluationContext): Promise<PhaseResult>;
    /** Check how many controllers have matching providers */
    private checkControllerProviderMapping;
    /** Extract domain keyword from a filename */
    private extractDomain;
    private computeRequirementsScore;
}
//# sourceMappingURL=requirements-coverage.evaluator.d.ts.map