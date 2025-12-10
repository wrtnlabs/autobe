import { MicroAgenticaHistory } from "@agentica/core";
import {
  AutoBeFunctionCallingMetric,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

/**
 * Result from RAG iteration in preliminary orchestration.
 *
 * Returned by process callback in `AutoBePreliminaryController.orchestrate()`.
 * If `value` is `null`, RAG loop continues; if non-null, orchestration completes.
 *
 * @author Samchon
 */
export interface IAutoBeOrchestrateResult<Model extends ILlmSchema.Model, T> {
  /** Task result: `null` = needs more context, non-null = completed. */
  value: T | null;

  /** LLM conversation histories including function calling. */
  histories: MicroAgenticaHistory<Model>[];

  /** Token usage metrics for this iteration. */
  tokenUsage: IAutoBeTokenUsageJson.IComponent;

  /** Function calling performance metrics. */
  metric: AutoBeFunctionCallingMetric;
}
