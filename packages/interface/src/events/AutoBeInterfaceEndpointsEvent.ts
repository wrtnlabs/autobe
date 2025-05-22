import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeInterfaceEndpointsEvent
  extends AutoBeEventBase<"interfaceEndpoints"> {
  endpoints: AutoBeOpenApi.IEndpoint[];
  step: number;
}
