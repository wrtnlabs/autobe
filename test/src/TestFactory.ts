import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import {
  AutoBeHistory,
  IAutoBeCompilerListener,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";

export interface TestFactory {
  createAgent: (
    histories: AutoBeHistory[],
    tokenUsage?: IAutoBeTokenUsageJson,
  ) => AutoBeAgent<"chatgpt">;
  createCompiler: (listener?: IAutoBeCompilerListener) => AutoBeCompiler;
}
