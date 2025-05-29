import { IAutoBePrismaCompilerResult } from "../compiler/IAutoBePrismaCompilerResult";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBePrismaCorrectEvent
  extends AutoBeEventBase<"prismaCorrect"> {
  input: Record<string, string>;
  failure: IAutoBePrismaCompilerResult.IFailure;
  correction: Record<string, string>;
  planning: string;
  step: number;
}
