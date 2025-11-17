import { IMicroAgenticaHistoryJson } from "@agentica/core";

export interface IAutoBeOrchestrateHistory {
  histories: IMicroAgenticaHistoryJson[];
  userMessage: string;
}
