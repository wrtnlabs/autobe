import { AutoBePreliminaryKind } from "../typings/AutoBePreliminaryKind";
import { AutoBeEventSource } from "./AutoBeEventSource";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

export interface AutoBePreliminaryEvent extends AutoBeEventBase<"preliminary"> {
  source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
  source_id: string;
  function: AutoBePreliminaryKind;
  arguments: Record<string, unknown>;
  trial: number;
}
