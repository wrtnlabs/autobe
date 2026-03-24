import { tags } from "typia";

/**
 * Interface representing a model entry registered under a vendor.
 *
 * Tracks which AI models have been registered for use with a particular vendor
 * configuration. When creating a session, the user specifies a model string
 * directly; this entity exists to maintain a managed list of models per vendor
 * for UI convenience (e.g., dropdowns, history).
 *
 * @author Samchon
 */
export interface IAutoBePlaygroundVendorModel {
  /** Unique identifier for this vendor-model entry. */
  id: string & tags.Format<"uuid">;

  /**
   * AI model identifier.
   *
   * The exact model name or identifier for the AI provider, such as "gpt-4.1",
   * "claude-sonnet-4-20250514", "qwen3-235b-a22b", etc.
   */
  model: string;

  /** Timestamp when this model was registered. */
  created_at: string & tags.Format<"date-time">;
}
