import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";
import { AutoBePreliminaryKind } from "../typings/AutoBePreliminaryKind";
import { AutoBeEventSource } from "./AutoBeEventSource";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

export interface AutoBePreliminaryEvent<
  Function extends AutoBePreliminaryKind = AutoBePreliminaryKind,
> extends AutoBeEventBase<"preliminary"> {
  source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
  source_id: string;
  function: Function;
  existing: Function extends "interfaceOperations"
    ? AutoBeOpenApi.IEndpoint[]
    : string[];
  requested: Function extends "interfaceOperations"
    ? AutoBeOpenApi.IEndpoint[]
    : string[];
  trial: number;
}
