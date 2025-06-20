import { tags } from "typia";

import { AutoBeUserMessageContentBase } from "./AutoBeUserMessageContentBase";

/**
 * Content type representing image input from users in the conversation.
 *
 * Enables users to share visual references, UI mockups, diagrams, screenshots,
 * design specifications, or any other visual materials that enhance requirement
 * communication. Image content significantly enriches the vibe coding
 * experience by allowing users to show rather than just describe their needs,
 * leading to more accurate understanding and better development outcomes.
 *
 * Visual references are particularly valuable for UI/UX requirements, system
 * architecture diagrams, workflow illustrations, existing system screenshots,
 * or design patterns that users want to implement or reference in their
 * projects. The AI assistant can analyze these images to extract design
 * patterns, layout structures, and visual requirements that inform the
 * development process.
 *
 * @author Samchon
 */
export interface AutoBeUserMessageImageContent
  extends AutoBeUserMessageContentBase<"image"> {
  /**
   * URL pointing to the uploaded image resource.
   *
   * Contains the location where the image file is stored and can be accessed
   * for processing. The URL enables the AI assistant to retrieve and analyze
   * the visual content, extracting relevant design patterns, UI elements,
   * architectural diagrams, or other visual information that informs the
   * development requirements.
   *
   * The URL-based approach allows for efficient handling of image content
   * without embedding large binary data directly in the message structure,
   * while ensuring the image remains accessible for analysis throughout the
   * development process.
   */
  url: string & tags.Format<"url">;

  /**
   * Optional processing detail level for image analysis.
   *
   * Specifies the level of detail and computational resources to use when
   * analyzing the image content. Different detail levels balance processing
   * speed, accuracy, and resource consumption based on the image's importance
   * and complexity.
   *
   * - "auto": Automatically determines appropriate detail level based on image
   *   characteristics
   * - "high": Performs detailed analysis for complex diagrams, detailed UI
   *   mockups, or critical visual specifications
   * - "low": Uses faster processing for simple images or when quick analysis is
   *   sufficient
   * - Undefined: Uses system default processing level
   */
  detail?: "auto" | "high" | "low" | undefined;
}
