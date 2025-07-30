import { AutoBeOpenApi } from "@autobe/interface";
import { hash } from "tstl";

export namespace ProviderCodeComparator {
  export function hashCode(e: AutoBeOpenApi.IEndpoint): number {
    return hash(e.path, e.method);
  }

  export function equals(
    x: AutoBeOpenApi.IEndpoint,
    y: AutoBeOpenApi.IEndpoint,
  ): boolean {
    return x.path === y.path && x.method === y.method;
  }
}
