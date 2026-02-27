import type { EvaluationContext, Issue } from "../../types";
import { GateEvaluator } from "../base";
/**
 * Type Evaluator Checks TypeScript type errors using AutoBeTypeScriptCompiler
 * (in-memory)
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
    /** Parse Prisma schema files and extract model definitions with typed fields. */
    private parsePrismaModels;
    /** Resolve a Prisma field type to a TypeScript type string. */
    private resolveFieldType;
    /**
     * Generate a Prisma client stub from schema files.
     *
     * AutoBE projects import from `@prisma/sdk` which maps to
     * `src/prisma/client.ts`, but this file is not generated during the realize
     * phase. We parse model definitions from `.prisma` schemas and build typed
     * stubs so the TypeScript compiler can resolve imports properly.
     */
    private generatePrismaStub;
    private readFilesAsRecord;
}
//# sourceMappingURL=type.evaluator.d.ts.map