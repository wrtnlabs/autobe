import { AutoBeUserContent } from "../contents/AutoBeUserContent";
import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

export interface AutoBeUserHistory extends AutoBeAgentHistoryBase<"user"> {
  contents: AutoBeUserContent[];
}
