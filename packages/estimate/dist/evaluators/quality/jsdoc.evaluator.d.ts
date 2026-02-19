import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult } from '../../types';
export declare class JsDocEvaluator extends BaseEvaluator {
    readonly name = "JsDocEvaluator";
    readonly phase: "quality";
    readonly description = "Checks for JSDoc comments";
    evaluate(context: EvaluationContext): Promise<PhaseResult>;
    private analyzeFile;
    private hasJsDoc;
}
//# sourceMappingURL=jsdoc.evaluator.d.ts.map