import { AutoBeFunctionCallingAggregate } from "../histories";
import { IAutoBeTokenUsageJson } from "../json/IAutoBeTokenUsageJson";

/**
 * Base interface for AutoBE events that track token usage.
 *
 * This interface provides token consumption tracking capabilities for events
 * emitted during the AutoBE backend generation process. It enables detailed
 * monitoring of AI token usage across different agent operations, supporting
 * cost analysis, performance optimization, and resource utilization tracking.
 *
 * Events extending this interface inherit the ability to report comprehensive
 * token usage metrics including total consumption, input token analysis with
 * caching statistics, and output token breakdown by generation type. This
 * granular tracking is essential for understanding and optimizing the
 * computational costs of the automated development pipeline.
 *
 * @author Samchon
 */
export interface AutoBeTokenUsageEventBase {
  /**
   * Detailed token usage metrics for the current operation.
   *
   * Contains comprehensive token consumption data including total usage, input
   * token breakdown with cache statistics, and output token categorization by
   * generation type. This component-level tracking enables precise analysis of
   * resource utilization for specific agent operations such as schema
   * generation, test writing, or code implementation.
   *
   * The token usage data helps identify optimization opportunities, monitor
   * operational costs, and ensure efficient use of AI resources throughout the
   * automated backend development process.
   */
  tokenUsage: IAutoBeTokenUsageJson.IComponent;

  /**
   * Aggregated function calling statistics for the current operation.
   *
   * Tracks the history of function calling attempts including total attempts,
   * successful calls, validation failures, and invalid JSON responses. This
   * aggregate data enables monitoring of AI agent reliability, identifying
   * problematic function calling patterns, and measuring the effectiveness of
   * self-healing loops in the AutoBE pipeline.
   *
   * The statistics help diagnose issues where agents struggle with specific
   * tools, optimize system prompts to reduce validation failures, and ensure
   * robust autonomous operation across the waterfall-spiral development
   * process.
   */
  aggregate: AutoBeFunctionCallingAggregate;
}
