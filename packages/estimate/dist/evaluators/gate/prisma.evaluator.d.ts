import type { EvaluationContext, Issue } from "../../types";
import { GateEvaluator } from "../base";
/**
 * Prisma Evaluator Validates Prisma schema using AutoBeDatabaseCompiler
 * (in-memory)
 */
export declare class PrismaEvaluator extends GateEvaluator {
    readonly name = "PrismaEvaluator";
    readonly description = "Validates Prisma schema using in-memory compiler";
    checkGate(context: EvaluationContext): Promise<{
        passed: boolean;
        issues: Issue[];
        metrics?: Record<string, number | string | boolean>;
    }>;
    private readFilesAsRecord;
}
//# sourceMappingURL=prisma.evaluator.d.ts.map