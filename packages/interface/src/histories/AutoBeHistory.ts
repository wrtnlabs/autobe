import { AutoBeAnalyzeHistory } from "./AutoBeAnalyzeHistory";
import { AutoBeInterfaceHistory } from "./AutoBeInterfaceHistory";
import { AutoBePrismaHistory } from "./AutoBePrismaHistory";
import { AutoBeRealizeHistory } from "./AutoBeRealizeHistory";
import { AutoBeReplyHistory } from "./AutoBeReplyHistory";
import { AutoBeTestHistory } from "./AutoBeTestHistory";
import { AutoBeUserHistory } from "./AutoBeUserHistory";

export type AutoBeHistory =
  | AutoBeUserHistory
  | AutoBeReplyHistory
  | AutoBeAnalyzeHistory
  | AutoBePrismaHistory
  | AutoBeInterfaceHistory
  | AutoBeTestHistory
  | AutoBeRealizeHistory;
export namespace AutoBeHistory {
  export type Type = AutoBeHistory["type"];
  export interface Mapper {
    user: AutoBeUserHistory;
    reply: AutoBeReplyHistory;
    analyze: AutoBeAnalyzeHistory;
    prisma: AutoBePrismaHistory;
    interface: AutoBeInterfaceHistory;
    test: AutoBeTestHistory;
    realize: AutoBeRealizeHistory;
  }
}
