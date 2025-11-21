import { IAutoBeTokenUsageJson } from "../json";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired when the Describe agent analyzes and describes an image.
 *
 * This event occurs when the Describe agent processes an image to extract
 * visual information, understand its content, and generate comprehensive
 * documentation. The analysis follows a sequential process from observation to
 * detailed description.
 *
 * The event provides progress tracking as multiple images are processed and
 * contains the analysis results with structured documentation.
 */
export interface AutoBeImageDescribeDraftEvent
  extends AutoBeEventBase<"imageDescribeDraft">,
    AutoBeProgressEventBase {
  /**
   * Raw observation of visual elements in the image.
   *
   * Contains uninterpreted documentation of everything visible including
   * objects, text, UI elements, colors, and spatial relationships.
   */
  observation: string;

  /**
   * Interpreted analysis of the observed elements.
   *
   * Explains what the observed elements mean, their purposes, relationships,
   * and the overall context of the image.
   */
  analysis: string;

  /**
   * Key topics or themes extracted from the image.
   *
   * Array of 3-5 kebab-case terms that represent the main subjects or
   * functional areas present in the image.
   */
  topics: string[];

  /**
   * Concise summary of the image content.
   *
   * A 2-3 sentence overview that captures the essence of what the image shows
   * and its primary purpose.
   */
  summary: string;

  /**
   * Comprehensive documentation of the image.
   *
   * Detailed markdown-formatted description organized into logical sections,
   * providing enough information for someone to understand the image without
   * seeing it.
   */
  draft: string;

  /**
   * Detailed token usage metrics for the operation.
   *
   * Contains comprehensive token consumption data including total usage, input
   * token breakdown with cache hit rates, and output token categorization by
   * generation type (reasoning, predictions). This component-level tracking
   * enables precise cost analysis and identification of operations that benefit
   * most from prompt caching or require optimization.
   *
   * Token usage directly translates to operational costs, making this metric
   * essential for understanding the financial implications of different
   * operation types and guiding resource allocation decisions.
   */
  tokenUsage: IAutoBeTokenUsageJson.IComponent;
}
