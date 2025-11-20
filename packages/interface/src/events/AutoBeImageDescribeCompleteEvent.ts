import { AutoBeUserMessageContent } from "../histories";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

/**
 * Event fired when the image-to-planning document conversion has successfully
 * completed.
 *
 * This event represents the completion of the describe phase where
 * user-provided images have been analyzed and transformed into structured
 * planning documents. The describe agent is responsible for converting visual
 * mockups, wireframes, screenshots, or any other image-based requirements into
 * comprehensive textual planning documents that can be understood by the facade
 * agent.
 *
 * The successful completion of this phase indicates that all images have been
 * properly interpreted, their UI/UX elements have been identified, and detailed
 * planning documents have been generated. These planning documents describe the
 * intended functionality, data structures, and API requirements extracted from
 * the visual inputs.
 *
 * @author michael
 */
export interface AutoBeImageDescribeCompleteEvent
  extends AutoBeEventBase<"imageDescribeComplete"> {
  /**
   * The input content to be passed to the facade agent.
   *
   * This array contains the transformed user message content where image
   * attachments have been converted into detailed planning documents. Each
   * content item represents either the original text messages from the user or
   * the generated planning documents that describe the backend requirements
   * extracted from the provided images.
   */
  contents: AutoBeUserMessageContent[];

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
}
