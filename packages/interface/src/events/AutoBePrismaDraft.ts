import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBePrismaDraftEvent extends AutoBeEventBase<"prismaDraft"> {
  draft: string;
  step: number;
}
