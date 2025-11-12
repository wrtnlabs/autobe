import { MicroAgenticaHistory } from "@agentica/core";
import {
  AutoBeFunctionCallingMetric,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

export interface IAutoBeOrchestrateResult<Model extends ILlmSchema.Model, T> {
  value: T | null;
  histories: MicroAgenticaHistory<Model>[];
  tokenUsage: IAutoBeTokenUsageJson.IComponent;
  metric: AutoBeFunctionCallingMetric;
}
