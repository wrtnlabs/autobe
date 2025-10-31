import { AutoBePhase } from "../../histories/AutoBePhase";
import { AutoBeProcessAggregateCollection } from "../../histories/contents/AutoBeProcessAggregateCollection";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Base interface for phase completion events in the AutoBE pipeline.
 *
 * This interface represents the successful completion of a major phase in the
 * AutoBE waterfall-spiral development process (Analyze, Prisma, Interface,
 * Test, Realize). Complete events aggregate all metrics, statistics, and
 * outcomes from the phase's internal agent operations, providing comprehensive
 * reporting for monitoring, cost analysis, and performance tracking.
 *
 * Unlike active operation events that track individual agent tasks, complete
 * events synthesize the entire phase execution, capturing the final state
 * machine step counter, total elapsed time, aggregated token usage across all
 * operations, and cumulative function calling metrics. This holistic view
 * enables understanding of phase-level resource consumption and operation
 * quality.
 *
 * The type-safe aggregation system ensures all metrics are properly organized
 * by event type, allowing detailed analysis of which specific operations
 * (schema generation, test writing, code realization, etc.) consumed the most
 * resources or encountered the most failures during the self-healing spiral
 * loops.
 *
 * @author Samchon
 */
export interface AutoBeCompleteEventBase<Type extends `${AutoBePhase}Complete`>
  extends AutoBeEventBase<Type> {
  /**
   * Final state machine step counter value for the phase.
   *
   * Records the terminal step number from the phase's state machine, which
   * increments monotonically during execution and invalidates cached state when
   * operations need to be redone. This step counter enables the frontend to
   * detect when previously completed operations have been invalidated by spiral
   * loop corrections, ensuring UI consistency with the actual generation
   * state.
   *
   * The step value provides a temporal marker for the phase completion,
   * allowing correlation with intermediate operation events that share the same
   * step number.
   *
   * @example
   *   ```typescript
   *   step: 42 // Phase completed at step 42
   *   ```;
   */
  step: number;

  /**
   * Total elapsed time for the phase execution in milliseconds.
   *
   * Measures the wall-clock duration from phase start to completion,
   * encompassing all agent operations, self-healing spiral loops, compiler
   * validations, and any retry attempts. This metric provides visibility into
   * phase-level performance and enables identification of bottlenecks in the
   * waterfall pipeline.
   *
   * The elapsed time includes both active LLM processing and any overhead from
   * compilation, validation, and orchestration logic. For detailed breakdown of
   * time spent in specific operations, consult the individual operation events
   * within the phase.
   *
   * @example
   *   ```typescript
   *   elapsed: 15234 // Phase took 15.234 seconds
   *   ```;
   */
  elapsed: number;

  /**
   * Aggregated token usage and function calling metrics by operation type.
   *
   * Maps each event type within the phase to its complete aggregate metrics,
   * including detailed token consumption breakdown with cache statistics and
   * comprehensive function calling metrics data. This comprehensive aggregation
   * enables deep analysis of resource utilization patterns and operation
   * quality across the entire phase.
   *
   * The partial record structure reflects that not all possible event types may
   * occur during phase execution. Only operations that were actually performed
   * will have entries in this mapping.
   *
   * The aggregate data supports cost analysis (via token usage), reliability
   * assessment (via function calling metrics), and optimization opportunities
   * (via cache hit rates and failure patterns).
   */
  aggregates: AutoBeProcessAggregateCollection<
    Type extends `${infer Phase}Complete` ? `${Phase}` : never
  >;
}
