import { IAutoBeTokenUsageJson } from "../../json";
import { AutoBeFunctionCallingMetric } from "./AutoBeFunctionCallingMetric";

/**
 * Aggregate metrics for a single AI agent operation (token usage + trial
 * stats).
 *
 * @author Samchon
 */
export interface AutoBeProcessAggregate {
  /** Token consumption breakdown (input, output, cache hits). */
  tokenUsage: IAutoBeTokenUsageJson.IComponent;

  /** Function calling trial statistics (total, success, failure counts). */
  metric: AutoBeFunctionCallingMetric;
}
