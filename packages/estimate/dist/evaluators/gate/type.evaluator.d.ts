import { GateEvaluator } from '../base';
import type { EvaluationContext, Issue } from '../../types';
/**
 * Type Evaluator
 * Checks TypeScript type errors using AutoBeTypeScriptCompiler (in-memory)
 */
export declare class TypeEvaluator extends GateEvaluator {
    readonly name = "TypeEvaluator";
    readonly description = "Checks TypeScript type errors using in-memory compiler";
    checkGate(context: EvaluationContext): Promise<{
        passed: boolean;
        issues: Issue[];
        metrics?: Record<string, number | string | boolean>;
    }>;
    private mapCompileResult;
    private readFilesAsRecord;
}
//# sourceMappingURL=type.evaluator.d.ts.map