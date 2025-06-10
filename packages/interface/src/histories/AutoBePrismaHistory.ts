import { tags } from "typia";

import { IAutoBePrismaCompilerResult } from "../compiler";
import { IAutoBePrismaValidation } from "../prisma";
import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

export interface AutoBePrismaHistory extends AutoBeAgentHistoryBase<"prisma"> {
  result: IAutoBePrismaValidation;
  schemas: Record<string, string>;
  compiled: IAutoBePrismaCompilerResult;
  reason: string;
  description: string;
  step: number;
  completed_at: string & tags.Format<"date-time">;
}
