import { AutoBeAggregateEventBase } from "../../events";
import { AutoBeEvent } from "../../events/AutoBeEvent";
import { AutoBePhase } from "../AutoBePhase";
import { AutoBeProcessAggregate } from "./AutoBeProcessAggregate";

/**
 * Type-safe collection of process aggregates organized by operation type.
 *
 * This generic type represents a comprehensive aggregation structure that maps
 * each AI agent operation within a specific phase (or across all phases) to its
 * cumulative execution metrics. The collection enables detailed analysis of
 * resource consumption and operational quality at both the individual operation
 * level and the overall aggregate level.
 *
 * The collection structure provides two levels of metric visibility:
 *
 * 1. **Operation-Level Metrics** - Individual entries for each operation type
 *    (e.g., `analyzeScenario`, `databaseSchema`, `realizeWrite`) containing
 *    isolated metrics for that specific operation across all executions.
 * 2. **Total Aggregate** - The mandatory `all` property that combines metrics from
 *    all operations into a single unified view, providing phase-level or
 *    pipeline-level totals.
 *
 * This dual-level structure supports both granular analysis (identifying which
 * specific operations are expensive or unreliable) and holistic reporting
 * (understanding overall phase or pipeline costs).
 *
 * @author Samchon
 * @template Phase - The pipeline phase to aggregate ("analyze", "database",
 *   "interface", "test", "realize") or "all" for cross-phase aggregation
 */
export type AutoBeProcessAggregateCollection<
  Phase extends AutoBePhase | "all" = "all",
> = {
  /**
   * Total aggregate metrics combining all operations.
   *
   * This mandatory property contains the sum of all operation-level metrics,
   * providing a unified view of total resource consumption and execution
   * outcomes for the entire phase or pipeline. The aggregation performs
   * element-wise addition across all token metrics and trial statistics,
   * ensuring comprehensive cost and reliability reporting.
   */
  total: AutoBeProcessAggregate;
} & Partial<Record<PhaseEventType<Phase>, AutoBeProcessAggregate>>;

type PhaseEventType<Phase extends AutoBePhase | "all"> = Phase extends "all"
  ? Extract<AutoBeEvent, AutoBeAggregateEventBase>["type"] extends infer U
    ? U extends `${string}Complete`
      ? never
      : U
    : never
  : Extract<AutoBeEvent, AutoBeAggregateEventBase>["type"] extends infer U
    ? U extends `${Phase}${string}`
      ? U extends `${string}Complete`
        ? never
        : U
      : never
    : never;
