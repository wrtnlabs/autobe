import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import {
  AutoBeHistory,
  IAutoBeCompilerListener,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

export interface TestFactory {
  createAgent: (
    histories: AutoBeHistory[],
    tokenUsage?: IAutoBeTokenUsageJson,
  ) => AutoBeAgent<ILlmSchema.Model>;
  createCompiler: (listener?: IAutoBeCompilerListener) => AutoBeCompiler;
}
