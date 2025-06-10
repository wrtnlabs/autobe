import { AutoBePrisma } from "../prisma";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBePrismaSchemasEvent
  extends AutoBeEventBase<"prismaSchemas"> {
  file: AutoBePrisma.IFile;
  completed: number;
  total: number;
  step: number;
}
