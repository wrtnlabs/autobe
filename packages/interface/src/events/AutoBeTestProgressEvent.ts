import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeTestProgressEvent
  extends AutoBeEventBase<"testProgress"> {
  files: Record<string, string>;
  completed: number;
  total: number;
  step: number;
}
