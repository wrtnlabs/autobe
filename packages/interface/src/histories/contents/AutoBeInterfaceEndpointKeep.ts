import { AutoBeOpenApi } from "../../openapi";

export interface AutoBeInterfaceEndpointKeep {
  reason: string;

  endpoint: AutoBeOpenApi.IEndpoint;

  type: "keep";
}
