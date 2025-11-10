import { IAgenticaHistoryJson } from "@agentica/core";

export interface IAutoBeTransformHistory {
  histories: Array<
    | IAgenticaHistoryJson.ISystemMessage
    | IAgenticaHistoryJson.IAssistantMessage
    | IAgenticaHistoryJson.IUserMessage
  >;
  userMessage: string;
}
