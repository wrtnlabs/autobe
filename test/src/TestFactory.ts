import { AutoBeAgent, AutoBeTokenUsage } from "@autobe/agent";
import {
  AutoBeHistory,
  IAutoBeCompiler,
  IAutoBeCompilerListener,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

export interface TestFactory {
  createAgent: (histories: AutoBeHistory[]) => AutoBeAgent<ILlmSchema.Model>;
  createCompiler: (listener?: IAutoBeCompilerListener) => IAutoBeCompiler;
  getTokenUsage: () => AutoBeTokenUsage;
}
