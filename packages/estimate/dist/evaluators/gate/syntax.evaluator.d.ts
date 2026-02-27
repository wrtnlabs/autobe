import type { EvaluationContext, Issue } from "../../types";
import { GateEvaluator } from "../base";
/** Syntax Evaluator Checks TypeScript syntax errors using the compiler API */
export declare class SyntaxEvaluator extends GateEvaluator {
    readonly name = "SyntaxEvaluator";
    readonly description = "Checks TypeScript syntax errors";
    checkGate(context: EvaluationContext): Promise<{
        passed: boolean;
        issues: Issue[];
        metrics?: Record<string, number | string | boolean>;
    }>;
    private checkFile;
    private checkSyntax;
    private getSyntaxDiagnostics;
}
//# sourceMappingURL=syntax.evaluator.d.ts.map