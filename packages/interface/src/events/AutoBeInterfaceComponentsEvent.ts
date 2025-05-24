import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeInterfaceComponentsEvent
  extends AutoBeEventBase<"interfaceComponents"> {
  components: AutoBeOpenApi.IComponents;
  completed: number;
  total: number;
  step: number;
}
