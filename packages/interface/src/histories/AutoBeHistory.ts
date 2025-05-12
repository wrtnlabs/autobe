import { AutoBeAnalyzeHistory } from "./AutoBeAnalyzeHistory";
import { AutoBeAssistantMessageHistory } from "./AutoBeAssistantMessageHistory";
import { AutoBeInterfaceHistory } from "./AutoBeInterfaceHistory";
import { AutoBePrismaHistory } from "./AutoBePrismaHistory";
import { AutoBeRealizeHistory } from "./AutoBeRealizeHistory";
import { AutoBeTestHistory } from "./AutoBeTestHistory";
import { AutoBeUserMessageHistory } from "./AutoBeUserMessageHistory";

export type AutoBeHistory =
  | AutoBeUserMessageHistory
  | AutoBeAssistantMessageHistory
  | AutoBeAnalyzeHistory
  | AutoBePrismaHistory
  | AutoBeInterfaceHistory
  | AutoBeTestHistory
  | AutoBeRealizeHistory;
export namespace AutoBeHistory {
  export type Type = AutoBeHistory["type"];
  export interface Mapper {
    userMessage: AutoBeUserMessageHistory;
    assistantMessage: AutoBeAssistantMessageHistory;
    analyze: AutoBeAnalyzeHistory;
    prisma: AutoBePrismaHistory;
    interface: AutoBeInterfaceHistory;
    test: AutoBeTestHistory;
    realize: AutoBeRealizeHistory;
  }
}
