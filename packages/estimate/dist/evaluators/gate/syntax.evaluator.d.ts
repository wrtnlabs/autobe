import { GateEvaluator } from '../base';
import type { EvaluationContext, Issue } from '../../types';
/**
 * Syntax Evaluator
 * Checks TypeScript syntax errors using the compiler API
 */
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