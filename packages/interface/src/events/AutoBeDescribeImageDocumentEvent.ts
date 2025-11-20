import { IAutoBeTokenUsageJson } from "../json";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

export interface AutoBeDescribeImageDocumentEvent
  extends AutoBeEventBase<"describeImageDocument"> {
  /**
   * The complete B2B SaaS requirements document.
   *
   * A comprehensive specification document that combines all integrated
   * sections into a cohesive whole, following enterprise software documentation
   * standards. Written entirely in English, this document serves as the
   * foundation for backend application development.
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
