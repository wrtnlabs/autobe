import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeTestCompleteEvent
  extends AutoBeEventBase<"testComplete"> {
  files: Record<string, string>;
  step: number;
}
