import { tags } from "typia";

/**
 * Interface representing a stored AI vendor configuration.
 *
 * This interface defines a persisted vendor configuration entity stored in the
 * database. Each vendor record contains the model, endpoint, and concurrency
 * settings needed to connect with an AI service provider. The API key is stored
 * encrypted in the database and is never exposed in API responses.
 *
 * Users register vendor configurations once, then reference them by ID when
 * creating new vibe coding sessions.
 *
 * @author Samchon
 */
export interface IAutoBePlaygroundVendor {
  /**
   * Unique identifier for this vendor configuration.
   */
  id: string & tags.Format<"uuid">;

  /**
   * Human-readable label for this vendor configuration.
   *
   * A descriptive name to distinguish between multiple vendor setups,
   * such as "My OpenAI", "Local Ollama", "Claude via OpenRouter", etc.
   */
  name: string;

  /**
   * AI model identifier specifying which model to use.
   *
   * The exact model name or identifier for the AI provider, such as
   * "gpt-4.1", "claude-sonnet-4-20250514", "qwen3-235b-a22b", etc.
   */
  model: string;

  /**
   * Optional custom base URL for the AI vendor's API endpoint.
   *
   * Allows specification of alternative API endpoints for custom deployments,
   * enterprise instances, OpenRouter, or local models. Null when using the
   * vendor's default public API endpoint.
   */
  baseURL: string | null;

  /**
   * Maximum number of concurrent API requests allowed.
   *
   * Controls the concurrency level for AI API calls to prevent rate limiting
   * and optimize system performance.
   *
   * @default 16
   */
  semaphore: number & tags.Type<"uint32">;

  /**
   * Timestamp when this vendor configuration was created.
   */
  created_at: string & tags.Format<"date-time">;
}
export namespace IAutoBePlaygroundVendor {
  /**
   * Properties for creating a new vendor configuration.
   *
   * The API key is provided in plaintext and will be encrypted by the server
   * before storage. It is never returned in any API response.
   */
  export interface ICreate {
    /** Human-readable label for this vendor configuration. */
    name: string;

    /** AI model identifier. */
    model: string;

    /**
     * API key for the AI vendor's services.
     *
     * Provided in plaintext; the server encrypts it with AES-CBC
     * before persisting to the database.
     */
    apiKey: string;

    /** Optional custom base URL. */
    baseURL?: string | null;

    /**
     * Maximum concurrent API requests.
     * @default 16
     */
    semaphore?: number & tags.Type<"uint32">;
  }

  /**
   * Properties for updating an existing vendor configuration.
   *
   * All fields are optional; only provided fields will be updated.
   * If apiKey is provided, it will be re-encrypted before storage.
   */
  export interface IUpdate {
    /** Human-readable label. */
    name?: string;

    /** AI model identifier. */
    model?: string;

    /**
     * New API key. If provided, the server re-encrypts it before storage.
     */
    apiKey?: string;

    /** Custom base URL. */
    baseURL?: string | null;

    /** Maximum concurrent API requests. */
    semaphore?: number & tags.Type<"uint32">;
  }
}
