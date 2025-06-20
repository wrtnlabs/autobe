import { AutoBeUserMessageContentBase } from "./AutoBeUserMessageContentBase";

/**
 * Content type representing textual input from users in the conversation.
 *
 * Serves as the primary communication medium for expressing requirements,
 * asking questions, providing clarifications, and engaging in detailed
 * discussions about development needs. Text content remains the most
 * fundamental and versatile way for users to communicate complex business
 * logic, technical specifications, and nuanced requirements in the vibe coding
 * process.
 *
 * While the system supports multimodal input including audio, images, and
 * files, text content provides the precision and clarity needed for detailed
 * requirement specification and iterative refinement of development goals. It
 * enables users to articulate complex business processes, technical
 * constraints, and specific implementation preferences with the detail
 * necessary for accurate code generation.
 *
 * @author Samchon
 */
export interface AutoBeUserMessageTextContent
  extends AutoBeUserMessageContentBase<"text"> {
  /**
   * The textual content of the user's message.
   *
   * Contains the user's written communication including requirements
   * descriptions, questions, feedback, clarifications, or any other textual
   * input that guides the development process. This text serves as the primary
   * source of business logic understanding and technical requirement
   * specification.
   *
   * The text content can range from simple queries to comprehensive requirement
   * documents, architectural decisions, feature specifications, or detailed
   * business process descriptions that inform the entire vibe coding pipeline
   * from analysis through implementation.
   */
  text: string;
}
