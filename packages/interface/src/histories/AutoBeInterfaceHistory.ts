import { tags } from "typia";

import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";
import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

export interface AutoBeInterfaceHistory
  extends AutoBeAgentHistoryBase<"interface"> {
  document: AutoBeOpenApi.IDocument;
  files: Record<string, string>;
  reason: string;
  step: number;
  completed_at: string & tags.Format<"date-time">;
}
