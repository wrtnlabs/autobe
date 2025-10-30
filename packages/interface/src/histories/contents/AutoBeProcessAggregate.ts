import { IAutoBeTokenUsageJson } from "../../json";
import { AutoBeFunctionCallingMetric } from "./AutoBeFunctionCallingMetric";

/**
 * Unified aggregate metrics for AI agent operation tracking.
 *
 * This interface represents a standardized container that combines token usage
 * statistics and function calling trial outcomes into a single reusable
 * structure. It provides comprehensive visibility into both the computational
 * cost (via token consumption) and operational quality (via trial success
 * rates) of individual AI agent operations within the AutoBE pipeline.
 *
 * Process aggregates serve as the fundamental unit of metrics collection,
 * enabling consistent tracking across different phases and operation types. By
 * pairing token usage with trial statistics, this structure supports holistic
 * analysis of agent performance, identifying operations that consume excessive
 * resources or exhibit high failure rates during autonomous execution.
 *
 * This type is used throughout the AutoBE system in three primary contexts:
 *
 * 1. **Active Operation Events** - Individual agent operations emit events
 *    extending `AutoBeAggregateEventBase`, which includes these metrics for
 *    real-time tracking of ongoing work (e.g., `AutoBeAnalyzeScenarioEvent`,
 *    `AutoBePrismaSchemaEvent`, `AutoBeRealizeWriteEvent`).
 * 2. **Phase Completion Events** - When phases complete, events extending
 *    `AutoBeCompleteEventBase` aggregate these metrics by operation type in the
 *    `aggregates` field, providing phase-level resource consumption analysis
 *    (e.g., `AutoBeAnalyzeCompleteEvent`, `AutoBePrismaCompleteEvent`).
 * 3. **History Records** - Aggregates are preserved in history records for
 *    post-execution analysis, cost reporting, and optimization decisions across
 *    multiple generation sessions.
 *
 * The standardization provided by this interface ensures that all metrics
 * follow a consistent schema, enabling reliable analytics, cross-phase
 * comparisons, and systematic identification of performance bottlenecks in the
 * vibe coding process.
 *
 * @author Samchon
 */
export interface AutoBeProcessAggregate {
  /**
   * Detailed token usage metrics for the operation.
   *
   * Contains comprehensive token consumption data including total usage, input
   * token breakdown with cache hit rates, and output token categorization by
   * generation type (reasoning, predictions). This component-level tracking
   * enables precise cost analysis and identification of operations that benefit
   * most from prompt caching or require optimization.
   *
   * Token usage directly translates to operational costs, making this metric
   * essential for understanding the financial implications of different
   * operation types and guiding resource allocation decisions.
   */
  tokenUsage: IAutoBeTokenUsageJson.IComponent;

  /**
   * Function calling trial statistics for the operation.
   *
   * Records the complete trial history of function calling attempts, tracking
   * total executions, successful completions, consent requests, validation
   * failures, and invalid JSON responses. These metrics reveal the reliability
   * and quality of AI agent autonomous operation with tool usage.
   *
   * Trial statistics are critical for identifying operations where agents
   * struggle with tool interfaces, generate invalid outputs, or require
   * multiple correction attempts through self-healing spiral loops. High
   * failure rates indicate opportunities for system prompt optimization or tool
   * interface improvements.
   */
  metric: AutoBeFunctionCallingMetric;
}
