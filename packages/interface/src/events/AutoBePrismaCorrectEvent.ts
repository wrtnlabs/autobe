import { AutoBePrismaSyntax, IAutoBePrismaValidation } from "../prisma";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBePrismaCorrectEvent
  extends AutoBeEventBase<"prismaCorrect"> {
  failure: IAutoBePrismaValidation.IFailure;
  correction: AutoBePrismaSyntax.IApplication;
  planning: string;
  step: number;
}
