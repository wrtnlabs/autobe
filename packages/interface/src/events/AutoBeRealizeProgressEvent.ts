import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeRealizeProgressEvent
  extends AutoBeEventBase<"realizeProgress"> {
  filename: string;
  content: string;
  completed: number;
  total: number;
  step: number;
}
