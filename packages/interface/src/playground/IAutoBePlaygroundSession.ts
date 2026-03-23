import { tags } from "typia";

import { AutoBeEventSnapshot } from "../events/AutoBeEventSnapshot";
import { AutoBePhase } from "../histories";
import { AutoBeHistory } from "../histories/AutoBeHistory";
import { IAutoBeTokenUsageJson } from "../json/IAutoBeTokenUsageJson";
import { IAutoBePlaygroundVendor } from "./IAutoBePlaygroundVendor";

/**
 * Interface representing a vibe coding session with full detail.
 *
 * This interface extends the summary with complete conversation histories and
 * event snapshots, providing all the data needed to reconstruct or review an
 * entire vibe coding session from start to finish.
 *
 * @author Samchon
 */
export interface IAutoBePlaygroundSession
  extends IAutoBePlaygroundSession.ISummary {
  /** Complete chronological history of user messages and agent responses. */
  histories: AutoBeHistory[];

  /** All event snapshots captured during the session. */
  snapshots: AutoBeEventSnapshot[];
}
export namespace IAutoBePlaygroundSession {
  /**
   * Summary view of a vibe coding session.
   *
   * Contains essential metadata and progress information without the full
   * conversation histories or event snapshots. Used for listing sessions and
   * displaying overview information.
   */
  export interface ISummary {
    /** Unique identifier for this session. */
    id: string & tags.Format<"uuid">;

    /** Vendor configuration used for this session. */
    vendor: IAutoBePlaygroundVendor;

    /**
     * AI model identifier specifying which model to use.
     *
     * The exact model name or identifier for the AI provider, such as
     * "gpt-4.1", "claude-sonnet-4-20250514", "qwen3-235b-a22b", etc.
     */
    model: string;

    /** Optional user-provided title for this session. */
    title: string | null;

    /** Locale used for AI assistant responses (e.g. "en-US", "ko-KR"). */
    locale: string;

    /** IANA timezone identifier (e.g. "Asia/Seoul", "America/New_York"). */
    timezone: string;

    /** Current pipeline phase, or null if not yet started. */
    phase: AutoBePhase | null;

    /** Accumulated token usage for cost tracking. */
    token_usage: IAutoBeTokenUsageJson;

    /** Timestamp when this session was created. */
    created_at: string & tags.Format<"date-time">;

    /** Timestamp when this session was completed, or null if still active. */
    completed_at: null | (string & tags.Format<"date-time">);
  }

  /**
   * Request parameters for searching and filtering sessions.
   *
   * Extends basic pagination with search and filter capabilities.
   */
  export interface IRequest {
    /** Search keyword for session title. */
    search?: string | null;

    /** Filter by vendor ID. */
    vendor_id?: (string & tags.Format<"uuid">) | null;

    /** Filter by model identifier. */
    model?: string | null;

    /** Page number. */
    page?: null | (number & tags.Type<"uint32">);

    /**
     * Limitation of records per a page.
     *
     * @default 100
     */
    limit?: null | (number & tags.Type<"uint32">);
  }

  /**
   * Properties for creating a new vibe coding session.
   *
   * Creates a session bound to a stored vendor configuration. The vendor's
   * decrypted API key will be used when establishing the AI agent connection.
   */
  export interface ICreate {
    /** ID of the stored vendor configuration to use. */
    vendor_id: string & tags.Format<"uuid">;

    /**
     * AI model identifier specifying which model to use.
     *
     * The exact model name or identifier for the AI provider, such as
     * "gpt-4.1", "claude-sonnet-4-20250514", "qwen3-235b-a22b", etc.
     */
    model: string;

    /**
     * Locale for AI assistant responses.
     *
     * When omitted, falls back to the global playground configuration.
     */
    locale?: string | null;

    /**
     * IANA timezone identifier.
     *
     * When omitted, falls back to the global playground configuration.
     */
    timezone?: string | null;

    /** Optional title for this session. */
    title?: string | null;

    /**
     * Mock session configuration from pre-recorded example data.
     *
     * Used exclusively by the server to create test sessions backed by
     * {@link AutoBeMockAgent}. Not exposed through any public API endpoint.
     *
     * @internal
     */
    mock?: IMock | undefined;
  }

  /**
   * Mock session descriptor.
   *
   * @internal
   */
  export interface IMock {
    /** Example vendor/model slug (e.g. `"openai/gpt-4.1"`). */
    vendor: string;

    /** Example project name (e.g. `"bbs"`, `"todo"`). */
    project: string;

    /** Artificial delay in milliseconds to simulate between events. */
    delay?: number | undefined;
  }

  /** Properties for updating an existing session. */
  export interface IUpdate {
    /** Updated title for this session. */
    title: string | null;
  }
}
