import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeInterfaceOperationsEvent
  extends AutoBeEventBase<"interfaceOperations"> {
  operations: AutoBeOpenApi.IOperation[];
  completed: number;
  total: number;
  step: number;
}
