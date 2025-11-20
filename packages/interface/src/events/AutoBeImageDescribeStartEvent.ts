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
export interface AutoBeImageDescribeStartEvent
  extends AutoBeEventBase<"imageDescribeStart"> {
  /**
   * Number of images to be analyzed.
   *
   * Indicates the number of images that will be analyzed by the describe agent.
   * This value helps track the progress of the image analysis process and
   * provides context for the user about the number of images that will be
   * analyzed.
   */
  imageCount: number;
}
