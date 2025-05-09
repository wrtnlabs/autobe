import { AutoBeAnalyzeHistory } from "./AutoBeAnalyzeHistory";
import { AutoBeConversateHistory } from "./AutoBeConversateHistory";
import { AutoBeInterfaceHistory } from "./AutoBeInterfaceHistory";
import { AutoBeRealizeHistory } from "./AutoBeRealizeHistory";
import { AutoBeTestHistory } from "./AutoBeTestHistory";

export type AutoBeHistory =
  | AutoBeConversateHistory
  | AutoBeAnalyzeHistory
  | AutoBeInterfaceHistory
  | AutoBeTestHistory
  | AutoBeRealizeHistory;
export namespace AutoBeHistory {
  export type Type = AutoBeHistory["type"];
  export interface Mapper {
    conversate: AutoBeConversateHistory;
    analyze: AutoBeAnalyzeHistory;
    interface: AutoBeInterfaceHistory;
    test: AutoBeTestHistory;
    realize: AutoBeRealizeHistory;
  }
}
