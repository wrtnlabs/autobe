import { Command } from "commander";
import { LLMProvider } from "./agents";
export interface CLIOptions {
    input: string;
    output: string;
    verbose?: boolean;
    continueOnGateFailure?: boolean;
    useAgent?: boolean;
    provider?: LLMProvider;
    apiKey?: string;
    autoFix?: boolean;
    runTests?: boolean;
    golden?: boolean;
    project?: string;
}
export declare function createProgram(): Command;
export declare function runCLI(options: CLIOptions): Promise<void>;
//# sourceMappingURL=cli.d.ts.map