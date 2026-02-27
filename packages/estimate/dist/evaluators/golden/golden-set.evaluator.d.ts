import type { EvaluationContext, PhaseResult } from "../../types";
export type GoldenProject = "todo" | "bbs" | "reddit" | "shopping";
export declare class GoldenSetEvaluator {
    readonly name = "GoldenSetEvaluator";
    evaluate(context: EvaluationContext, project: GoldenProject, port?: number): Promise<PhaseResult>;
}
//# sourceMappingURL=golden-set.evaluator.d.ts.map