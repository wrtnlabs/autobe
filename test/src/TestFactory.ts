import { AutoBeAgent, AutoBeTokenUsage } from "@autobe/agent";
import {
  AutoBeHistory,
  IAutoBeCompiler,
  IAutoBeCompilerListener,
} from "@autobe/interface";

export interface TestFactory {
  createAgent: (histories: AutoBeHistory[]) => AutoBeAgent;
  createCompiler: (listener?: IAutoBeCompilerListener) => IAutoBeCompiler;
  getTokenUsage: () => AutoBeTokenUsage;
}
