import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBePrismaSchemasEvent
  extends AutoBeEventBase<"prismaSchemas"> {
  filename: string;
  content: string;
  completed: number;
  total: number;
  step: number;
}
