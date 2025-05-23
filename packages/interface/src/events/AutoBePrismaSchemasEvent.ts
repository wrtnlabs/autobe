import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBePrismaSchemasEvent
  extends AutoBeEventBase<"prismaSchemas"> {
  files: Record<string, string>;
  step: number;
}
