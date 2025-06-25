import { AutoBeAgent } from "@autobe/agent";
import { AutoBeHistory } from "@autobe/interface";

export interface TestFactory {
  createAgent: (histories: AutoBeHistory[]) => AutoBeAgent<"chatgpt">;
}
