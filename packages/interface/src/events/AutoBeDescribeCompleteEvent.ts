import { AutoBeUserMessageContent } from "../histories";
import { AutoBeCompleteEventBase } from "./base/AutoBeCompleteEventBase";

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
export interface AutoBeDescribeCompleteEvent
  extends AutoBeCompleteEventBase<"describeComplete"> {
  /**
   * The input content to be passed to the facade agent.
   *
   * This array contains the transformed user message content where image
   * attachments have been converted into detailed planning documents. Each
   * content item represents either the original text messages from the user or
   * the generated planning documents that describe the backend requirements
   * extracted from the provided images.
   *
   * The describe agent analyzes visual elements such as forms, buttons, data
   * displays, and user flows in the images, then generates comprehensive
   * planning documents that specify the necessary APIs, data models, business
   * logic, and validation rules. These planning documents serve as the primary
   * input for the facade agent to begin the backend generation process.
   */
  document: string;

  /**
   * Executive summary of the complete system.
   *
   * Provides a high-level overview of all functional areas, key features, and
   * the overall system architecture derived from image analysis.
   */
  summary: string;

  /**
   * List of all functional areas covered in the document.
   *
   * Each entry corresponds to a major section in the final document, helping
   * readers navigate to specific areas of interest.
   */
  sections: string[];
}
