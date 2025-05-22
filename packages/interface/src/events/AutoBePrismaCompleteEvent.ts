import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBePrismaCompleteEvent
  extends AutoBeEventBase<"prismaComplete"> {
  schemas: Record<string, string>;
  diagrams: Record<string, string>;
  document: string;
  step: number;
}
