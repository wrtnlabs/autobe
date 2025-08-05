import { AutoBeAgent } from "@autobe/agent";
import {
  AutoBeHistory,
  IAutoBeCompiler,
  IAutoBeCompilerListener,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

export interface TestFactory {
  createAgent: (
    histories: AutoBeHistory[],
    tokenUsage?: IAutoBeTokenUsageJson,
  ) => AutoBeAgent<ILlmSchema.Model>;
  createCompiler: (listener?: IAutoBeCompilerListener) => IAutoBeCompiler;
}
