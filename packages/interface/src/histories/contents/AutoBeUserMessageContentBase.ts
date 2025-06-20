/**
 * Base interface for all user message content types in the multimodal system.
 *
 * Provides the fundamental structure shared by all content modalities including
 * text, audio, image, and file content. This base interface ensures consistent
 * type discrimination across all user input formats, enabling type-safe
 * processing of heterogeneous content arrays within user messages.
 *
 * The generic type parameter enables compile-time type safety when working with
 * specific content types while maintaining a unified interface for multimodal
 * content handling. This design supports the extensibility of the content
 * system while ensuring robust type checking throughout the vibe coding
 * pipeline.
 *
 * @author Samchon
 */
export interface AutoBeUserMessageContentBase<Type extends string> {
  /**
   * Type discriminator for identifying the specific content modality.
   *
   * Provides type-safe discrimination between different content types such as
   * "text", "audio", "image", and "file". This discriminator enables proper
   * type narrowing and ensures that each content type is processed according to
   * its specific characteristics and requirements.
   *
   * The type field is essential for the multimodal content processing pipeline,
   * allowing the system to route different content types to appropriate
   * handlers while maintaining type safety throughout the conversation flow.
   */
  type: Type;
}
