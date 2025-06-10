import { IAutoBePrismaCompilerResult } from "../compiler";
import { AutoBePrisma } from "../prisma";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBePrismaCompleteEvent
  extends AutoBeEventBase<"prismaComplete"> {
  application: AutoBePrisma.IApplication;
  schemas: Record<string, string>;
  compiled: IAutoBePrismaCompilerResult;
  step: number;
}
