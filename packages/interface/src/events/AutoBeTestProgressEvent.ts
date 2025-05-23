import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeTestProgressEvent
  extends AutoBeEventBase<"testProgress"> {
  filename: string;
  content: string;
  completed: number;
  total: number;
  step: number;
}
