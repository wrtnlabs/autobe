import type { EvaluationContext, Issue } from "../../types";
import { GateEvaluator } from "../base";
export declare class RuntimeEvaluator extends GateEvaluator {
    readonly name = "RuntimeEvaluator";
    readonly description = "Starts the server with Docker or direct execution and runs e2e tests";
    private serverProcess;
    checkGate(context: EvaluationContext): Promise<{
        passed: boolean;
        issues: Issue[];
        metrics?: Record<string, number | string | boolean>;
    }>;
    private composeUp;
    private composeDown;
    private detectApiPort;
    private buildProject;
    private setupDatabase;
    private startServer;
    private killServer;
    private cleanup;
    private waitForServer;
    private runTests;
    private parseTestOutput;
    private sleep;
}
//# sourceMappingURL=runtime.evaluator.d.ts.map