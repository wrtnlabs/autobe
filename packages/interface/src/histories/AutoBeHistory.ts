import { AutoBeAnalyzeHistory } from "./AutoBeAnalyzeHistory";
import { AutoBeConversateHistory } from "./AutoBeConversateHistory";
import { AutoBeInterfaceHistory } from "./AutoBeInterfaceHistory";
import { AutoBePrismaHistory } from "./AutoBePrismaHistory";
import { AutoBeRealizeHistory } from "./AutoBeRealizeHistory";
import { AutoBeTestHistory } from "./AutoBeTestHistory";

export type AutoBeHistory =
  | AutoBeConversateHistory
  | AutoBeAnalyzeHistory
  | AutoBePrismaHistory
  | AutoBeInterfaceHistory
  | AutoBeTestHistory
  | AutoBeRealizeHistory;
export namespace AutoBeHistory {
  export type Type = AutoBeHistory["type"];
  export interface Mapper {
    conversate: AutoBeConversateHistory;
    analyze: AutoBeAnalyzeHistory;
    prisma: AutoBePrismaHistory;
    interface: AutoBeInterfaceHistory;
    test: AutoBeTestHistory;
    realize: AutoBeRealizeHistory;
  }
}
