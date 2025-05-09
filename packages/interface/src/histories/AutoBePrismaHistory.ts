import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

export interface AutoBePrismaHistory extends AutoBeAgentHistoryBase<"prisma"> {
  files: Record<string, string>;
  description: string;
}
