/**
 * Base interface for AutoBE events that track progress.
 *
 * This interface provides common progress tracking properties for events that
 * represent operations performed in steps or batches. It allows consistent
 * progress monitoring across different agent operations like test generation,
 * code writing, schema creation, and interface design.
 *
 * Events extending this interface can report their completion status, enabling
 * real-time progress visualization and estimation of remaining work time.
 *
 * @author Samchon
 */
export interface AutoBeProgressEventBase {
  /**
   * A unique identifier for the event group.
   *
   * Ensures that event occurrences can be distinguished even when they share
   * the same name. This prevents metric collisions across different event
   * sources or instances, enabling accurate tracking and aggregation.
   *
   * Especially critical when accumulating `completed` counts: multiple events
   * with the same name can still be tracked independently thanks to this ID.
   *
   * Example use cases:
   *
   * - Distinguishing between similar code-generation tasks running in parallel.
   * - Separating progress metrics for identical interface design steps triggered
   *   by different agents.
   */
  id: string;

  /**
   * Total number of items to process.
   *
   * Represents the complete count of operations, files, endpoints, or other
   * entities that need to be processed in the current workflow step. This value
   * is typically determined at the beginning of an operation and remains
   * constant throughout the process.
   *
   * Used together with the `completed` field to calculate progress percentage
   * and estimate time to completion.
   */
  total: number;

  /**
   * Number of items completed.
   *
   * Tracks how many items have been successfully processed so far in the
   * current operation. This value increments as each item is completed,
   * providing real-time progress indication.
   *
   * The ratio of `completed` to `total` gives the completion percentage:
   * `progress = (completed / total) * 100`
   */
  completed: number;
}
