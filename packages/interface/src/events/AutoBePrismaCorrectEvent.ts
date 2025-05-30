import { AutoBePrisma, IAutoBePrismaValidation } from "../prisma";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBePrismaCorrectEvent
  extends AutoBeEventBase<"prismaCorrect"> {
  failure: IAutoBePrismaValidation.IFailure;
  correction: AutoBePrisma.IApplication;
  planning: string;
  step: number;
}
