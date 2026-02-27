import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult } from '../../types';
export declare class DuplicationEvaluator extends BaseEvaluator {
    readonly name = "DuplicationEvaluator";
    readonly phase: "quality";
    readonly description = "Detects duplicate code blocks";
    private readonly MIN_LINES;
    private readonly MIN_CHARS;
    evaluate(context: EvaluationContext): Promise<PhaseResult>;
    private collectBlocks;
}
//# sourceMappingURL=duplication.evaluator.d.ts.map