import { IAutoBePrismaCompilerResult } from "../compiler";
import { AutoBePrismaSyntax } from "../prisma";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBePrismaCompleteEvent
  extends AutoBeEventBase<"prismaComplete"> {
  application: AutoBePrismaSyntax.IApplication;
  schemas: Record<string, string>;
  compiled: IAutoBePrismaCompilerResult;
  step: number;
}
