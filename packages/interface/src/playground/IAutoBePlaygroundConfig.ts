import { tags } from "typia";

/**
 * Global configuration for the playground application.
 *
 * Stored as a singleton record in the database. Provides default values for
 * session creation (locale, timezone) and frontend form pre-fill (default
 * vendor and model).
 *
 * @author Samchon
 */
export interface IAutoBePlaygroundConfig {
  /**
   * Default locale for new sessions.
   *
   * Used as the server-side fallback when a session is created without an
   * explicit locale.
   *
   * @default "en-US"
   */
  locale: string;

  /**
   * Default IANA timezone identifier for new sessions.
   *
   * Used as the server-side fallback when a session is created without an
   * explicit timezone.
   *
   * @default "UTC"
   */
  timezone: string;

  /**
   * Default vendor ID for the frontend to pre-fill the session creation form.
   *
   * Not used server-side for session creation — `vendor_id` is still required
   * in `ICreate.IProps`. This is purely a frontend convenience.
   */
  default_vendor_id: (string & tags.Format<"uuid">) | null;

  /**
   * Default model identifier for the frontend to pre-fill.
   *
   * Not used server-side for session creation — `model` is still required in
   * `ICreate.IProps`.
   */
  default_model: string | null;
}
export namespace IAutoBePlaygroundConfig {
  /**
   * Properties for updating the global configuration.
   *
   * All fields are optional — only provided fields are updated.
   */
  export interface IUpdate {
    /** @default "en-US" */
    locale?: string | null;

    /** @default "UTC" */
    timezone?: string | null;

    /** Set to null to clear the default vendor. */
    default_vendor_id?: (string & tags.Format<"uuid">) | null;

    /** Set to null to clear the default model. */
    default_model?: string | null;
  }
}
