import type { CompareInput, CompareResult } from "./types";
export declare class CompareEvaluator {
    private verbose;
    constructor(verbose?: boolean);
    /** Compare projects - either from existing reports or by running evaluations */
    compare(input: CompareInput): Promise<CompareResult>;
    private sanitizeName;
    private runEstimate;
    private loadResult;
    private extractAgentScores;
    private extractPenalties;
    private generateComparison;
}
//# sourceMappingURL=CompareEvaluator.d.ts.map