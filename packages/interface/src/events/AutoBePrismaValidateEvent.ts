import { IAutoBePrismaCompilerResult } from "../compiler";
import { IAutoBePrismaValidation } from "../prisma/IAutoBePrismaValidation";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBePrismaValidateEvent
  extends AutoBeEventBase<"prismaValidate"> {
  result: IAutoBePrismaValidation.IFailure;
  compiled: IAutoBePrismaCompilerResult;
  schemas: Record<string, string>;
  step: number;
}
