import { IAutoBePrismaCompilerResult } from "../compiler/IAutoBePrismaCompilerResult";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBePrismaValidateEvent
  extends AutoBeEventBase<"prismaValidate"> {
  schemas: Record<string, string>;
  result:
    | IAutoBePrismaCompilerResult.IFailure
    | IAutoBePrismaCompilerResult.IException;
  step: number;
}
