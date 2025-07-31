import { tags } from "typia";

/**
 * Base interface for all AutoBE exceptions. Provides common structure and
 * properties that all specific exceptions extend.
 */
export interface AutoBeExceptionBase<Type extends string> {
  /**
   * Discriminator property that identifies the specific type of exception. Each
   * exception type has a unique string literal value.
   */
  type: Type;

  /**
   * Timestamp indicating when the exception occurred. Formatted as ISO 8601
   * date-time string (e.g., "2024-01-01T00:00:00Z").
   */
  created_at: tags.Format<"date-time">;
}
