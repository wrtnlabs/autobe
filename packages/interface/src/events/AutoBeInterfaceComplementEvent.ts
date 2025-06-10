import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeInterfaceComplementEvent
  extends AutoBeEventBase<"interfaceComplement"> {
  missed: string[];
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  step: number;
}
