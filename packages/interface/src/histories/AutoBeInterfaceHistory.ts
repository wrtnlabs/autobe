import { IAutoBeRouteDocument } from "../route/IAutoBeRouteDocument";
import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

export interface AutoBeInterfaceHistory
  extends AutoBeAgentHistoryBase<"interface"> {
  document: IAutoBeRouteDocument;
  reason: string;
  description: string;
  step: number;
}
