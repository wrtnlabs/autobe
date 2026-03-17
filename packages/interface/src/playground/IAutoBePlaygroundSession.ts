import { tags } from "typia";

import { AutoBeEventSnapshot } from "../events/AutoBeEventSnapshot";
import { AutoBePhase } from "../histories";
import { AutoBeHistory } from "../histories/AutoBeHistory";
import { IAutoBeTokenUsageJson } from "../json/IAutoBeTokenUsageJson";
import { IAutoBePlaygroundVendor } from "./IAutoBePlaygroundVendor";

/**
 * Interface representing a vibe coding session with full detail.
 *
 * This interface extends the summary with complete conversation histories
 * and event snapshots, providing all the data needed to reconstruct or
 * review an entire vibe coding session from start to finish.
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
   * Contains essential metadata and progress information without the
   * full conversation histories or event snapshots. Used for listing
   * sessions and displaying overview information.
   */
  export interface ISummary {
    /** Unique identifier for this session. */
    id: string & tags.Format<"uuid">;

    /** Vendor configuration used for this session. */
    vendor: IAutoBePlaygroundVendor;

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
   * Properties for creating a new vibe coding session.
   *
   * References a stored vendor configuration by ID. The vendor's decrypted
   * API key will be used when establishing the AI agent connection.
   */
  export interface ICreate {
    /** ID of the stored vendor configuration to use. */
    vendor_id: string & tags.Format<"uuid">;

    /** Locale for AI assistant responses. */
    locale: string;

    /** IANA timezone identifier. */
    timezone: string;

    /** Optional title for this session. */
    title?: string | null;
  }

  /**
   * Properties for updating an existing session.
   */
  export interface IUpdate {
    /** Updated title for this session. */
    title: string | null;
  }
}
