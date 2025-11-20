import { AutoBeUserImageConversateContent } from "../../events";

export interface AutoBeImageDescribeDraft {
  /**
   * Image content that was analyzed.
   *
   * Contains the image content that was analyzed. This includes the image data
   * and any additional information about the image, such as the image URL or
   * base64-encoded data.
   */
  image: AutoBeUserImageConversateContent;

  /**
   * Step 1: Initial Observation
   *
   * Raw, uninterpreted observation of what is visible in the image. List
   * everything you can see without making assumptions or interpretations. Be
   * thorough and systematic, covering all visual elements from top to bottom.
   *
   * Include:
   *
   * - All visible objects and their positions
   * - Text content (labels, values, titles)
   * - UI elements (buttons, forms, menus)
   * - Colors, shapes, and visual patterns
   * - Layout and spatial relationships
   */
  observation: string;

  /**
   * Step 2: Content Analysis
   *
   * Interpret and understand what the observed elements mean. Connect the dots
   * between different elements and identify their purposes.
   *
   * Analyze:
   *
   * - The type and purpose of the image
   * - Functional relationships between elements
   * - User interactions or workflows
   * - Technical specifications or architectures
   * - Domain context and business logic
   */
  analysis: string;

  /**
   * Step 3: Key Topics
   *
   * Extract 3-5 main topics or themes from the image. Use kebab-case format for
   * consistency.
   *
   * Examples:
   *
   * - "user-dashboard", "data-analytics", "form-validation"
   * - "payment-flow", "inventory-management", "report-generation"
   */
  topics: string[];

  /**
   * Step 4: Summary
   *
   * Write a concise 2-3 sentence summary of the image. Capture the essence of
   * what the image shows and its primary purpose. This should give readers
   * immediate understanding without seeing the image.
   */
  summary: string;

  /**
   * Step 5: Detailed Description
   *
   * Comprehensive documentation of the image content in markdown format.
   * Organize information into clear sections based on what you observed.
   *
   * Structure your description with appropriate sections such as:
   *
   * - Overview of the interface/content
   * - Main components and their functions
   * - Data or information displayed
   * - User interactions available
   * - Technical details if applicable
   *
   * Write in a way that someone could understand or recreate the image content
   * without seeing it.
   */
  description: string;
}
