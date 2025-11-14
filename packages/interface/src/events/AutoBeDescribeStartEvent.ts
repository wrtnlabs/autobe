import { AutoBeEventBase } from "./base/AutoBeEventBase";

/**
 * Event fired when the Describe agent begins the image analysis and planning
 * document generation process.
 *
 * This event marks the initiation of the sophisticated image-to-planning
 * document conversion pipeline that transforms visual mockups, wireframes,
 * screenshots, and other image-based requirements into comprehensive textual
 * planning documents. The Describe agent start represents the beginning of the
 * critical visual interpretation phase that enables vibe coding from
 * image-based specifications.
 *
 * The image analysis process that begins with this event will proceed through
 * draft generation, grouping, integration, and document finalization to produce
 * structured planning documents that accurately capture the intended backend
 * functionality, data models, and API requirements derived from visual inputs.
 *
 * @author michael
 */
export interface AutoBeDescribeStartEvent
  extends AutoBeEventBase<"describeStart"> {
  /**
   * Iteration number of the requirements analysis this describe process is
   * being started for.
   *
   * Indicates which version of the requirements analysis this image description
   * will support. A value of 0 means this is part of the initial requirements
   * gathering, while higher values represent subsequent revisions where
   * additional visual specifications are being incorporated.
   *
   * This step number ensures proper synchronization between the describe phase
   * and the overall requirements development process, maintaining consistency
   * across iterative refinements.
   */
  step: number;
}
