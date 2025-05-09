import { OpenApi } from "@samchon/openapi";

import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

export interface AutoBeInterfaceHistory
  extends AutoBeAgentHistoryBase<"interface"> {
  document: OpenApi.IDocument;
  reason: string;
  description: string;
}
