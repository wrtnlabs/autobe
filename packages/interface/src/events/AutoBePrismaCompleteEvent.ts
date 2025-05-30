import { AutoBePrismaSyntax } from "../prisma";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBePrismaCompleteEvent
  extends AutoBeEventBase<"prismaComplete"> {
  application: AutoBePrismaSyntax.IApplication;
  schemas: Record<string, string>;
  diagrams: Record<string, string>;
  document: string;
  step: number;
}
