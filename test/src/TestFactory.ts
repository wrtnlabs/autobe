import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { AutoBeHistory, IAutoBeCompilerListener } from "@autobe/interface";

export interface TestFactory {
  createAgent: (histories: AutoBeHistory[]) => AutoBeAgent<"chatgpt">;
  createCompiler: (listener?: IAutoBeCompilerListener) => AutoBeCompiler;
}
