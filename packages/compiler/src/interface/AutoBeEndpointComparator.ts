import { AutoBeOpenApi } from "@autobe/interface";
import { hash } from "tstl";

export namespace AutoBeEndpointComparator {
  export const equals = (
    x: AutoBeOpenApi.IEndpoint,
    y: AutoBeOpenApi.IEndpoint,
  ): boolean => x.method === y.method && x.path === y.path;

  export const hashCode = (endpoint: AutoBeOpenApi.IEndpoint): number =>
    hash(endpoint.path, endpoint.method);
}
