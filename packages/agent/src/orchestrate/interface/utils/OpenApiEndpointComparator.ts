import { AutoBeOpenApi } from "@autobe/interface";
import { hash } from "tstl";

export namespace OpenApiEndpointComparator {
  export function hashCode(e: AutoBeOpenApi.IEndpoint): number {
    return hash(e.path, e.method);
  }

  export function equals(
    x: AutoBeOpenApi.IEndpoint,
    y: AutoBeOpenApi.IEndpoint,
  ): boolean {
    return x.path === y.path && x.method === y.method;
  }

  export function compare(
    x: AutoBeOpenApi.IEndpoint,
    y: AutoBeOpenApi.IEndpoint,
  ): number {
    if (x.path !== y.path) return x.path.localeCompare(y.path);
    return x.method.localeCompare(y.method);
  }
}
