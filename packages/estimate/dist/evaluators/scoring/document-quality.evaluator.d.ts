import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult } from '../../types';
export declare class DocumentQualityEvaluator extends BaseEvaluator {
    readonly name = "DocumentQualityEvaluator";
    readonly phase: "documentQuality";
    readonly description = "Evaluates documentation quality";
    evaluate(context: EvaluationContext): Promise<PhaseResult>;
    private readDocsFolder;
    private readReadme;
}
//# sourceMappingURL=document-quality.evaluator.d.ts.map