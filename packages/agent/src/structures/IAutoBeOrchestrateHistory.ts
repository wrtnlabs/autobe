import { IAgenticaHistoryJson } from "@agentica/core";

export interface IAutoBeOrchestrateHistory {
  histories: Array<
    | IAgenticaHistoryJson.ISystemMessage
    | IAgenticaHistoryJson.IAssistantMessage
    | IAgenticaHistoryJson.IUserMessage
  >;
  userMessage: string;
}
