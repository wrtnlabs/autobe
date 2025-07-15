import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeRealizeDecoratorEvent
  extends AutoBeEventBase<"realizeDecorator"> {
  files: Record<string, string>;
  completed: number;
  total: number;
}
