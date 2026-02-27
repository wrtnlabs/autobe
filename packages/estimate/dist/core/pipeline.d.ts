import type { EvaluationContext, EvaluationInput, EvaluationResult } from "../types";
export declare class EvaluationPipeline {
    private verbose;
    private context;
    constructor(verbose?: boolean);
    getContext(): EvaluationContext | null;
    evaluate(input: EvaluationInput): Promise<EvaluationResult>;
    private runGate;
    private runPhase;
    private collectReferenceInfo;
    private createEmptyReference;
    private createGateFailure;
    private buildResult;
    private log;
}
//# sourceMappingURL=pipeline.d.ts.map