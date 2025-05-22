import { tags } from "typia";

import { IAutoBePrismaCompilerResult } from "../compiler/IAutoBePrismaCompilerResult";
import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

export interface AutoBePrismaHistory extends AutoBeAgentHistoryBase<"prisma"> {
  result: IAutoBePrismaCompilerResult;
  reason: string;
  description: string;
  step: number;
  completed_at: string & tags.Format<"date-time">;
}
