import { AutoBePrismaSyntax } from "../prisma";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBePrismaSchemasEvent
  extends AutoBeEventBase<"prismaSchemas"> {
  file: AutoBePrismaSyntax.IFile;
  completed: number;
  total: number;
  step: number;
}
