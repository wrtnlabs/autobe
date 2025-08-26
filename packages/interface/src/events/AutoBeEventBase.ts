import { tags } from "typia";

/**
 * Base interface for all AutoBE events.
 *
 * This interface provides the fundamental structure for all events emitted by
 * the AutoBE system during the backend application generation process. It
 * ensures consistent event identification and temporal tracking across all
 * agent operations.
 *
 * All events in the AutoBE ecosystem extend this base interface, inheriting its
 * type discrimination and timestamp capabilities. This allows for type-safe
 * event handling and chronological event stream processing.
 *
 * @author Samchon
 * @template Type The literal string type that uniquely identifies the event
 */
export interface AutoBeEventBase<Type extends string> {
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
   * Unique identifier for the event type.
   *
   * A literal string that discriminates between different event types in the
   * AutoBE system. This field enables TypeScript's discriminated union feature,
   * allowing type-safe event handling through switch statements or conditional
   * checks.
   *
   * Examples: "analyzeWrite", "prismaSchemas", "interfaceOperations",
   * "testScenarios"
   */
  type: Type;

  /**
   * Timestamp when the event was created.
   *
   * ISO 8601 formatted date-time string indicating when this event was emitted
   * by the system. This timestamp is crucial for event ordering, performance
   * analysis, and debugging the agent workflow execution timeline.
   *
   * Format: "YYYY-MM-DDTHH:mm:ss.sssZ" (e.g., "2024-01-15T14:30:45.123Z")
   */
  created_at: string & tags.Format<"date-time">;
}
