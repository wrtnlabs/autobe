/**
 * Interface defining behavioral configuration for AutoBeAgent localization and
 * context.
 *
 * This interface customizes the agent's communication style, language
 * preferences, and geographical context to provide personalized vibe coding
 * experiences. The configuration enables culturally appropriate interactions
 * and regionally aware development decisions throughout the automated
 * development pipeline.
 *
 * Locale and timezone settings influence not only the language of communication
 * but also contextual understanding of regulatory requirements, business
 * practices, and temporal considerations that may affect requirements analysis,
 * database design, API specifications, and implementation approaches.
 *
 * @author Samchon
 */
export interface IAutoBeConfig {
  /**
   * Language and cultural locale preference for AI agent communication.
   *
   * Configures the language and cultural context for all AI assistant responses
   * throughout the vibe coding process. When specified, the agent will
   * communicate in the preferred language while respecting cultural conventions
   * and linguistic nuances during requirements gathering, progress updates, and
   * guidance provision.
   *
   * The locale setting also influences the agent's understanding of regional
   * business practices, regulatory considerations, and cultural expectations
   * that may impact software design decisions and implementation approaches.
   *
   * Common formats follow BCP 47 language tags such as "en-US", "ko-KR",
   * "ja-JP", "zh-CN", "de-DE", etc. Platform-specific detection methods:
   *
   * - Browser: `navigator.language`
   * - Node.js: `process.env.LANG.split(".")[0]`
   *
   * @default System locale or "en" if unavailable
   */
  locale?: string;

  /**
   * Geographic timezone for temporal context and time-sensitive operations.
   *
   * Provides timezone awareness for proper handling of time-related
   * considerations during the vibe coding process. This includes scheduling
   * references, temporal business logic requirements, timestamp handling in
   * generated code, and time-based communications that need to be
   * contextualized for the user's local time.
   *
   * Timezone awareness ensures that generated applications properly handle time
   * zones, that scheduling-related requirements are interpreted correctly, and
   * that temporal references in documentation and code comments reflect the
   * user's geographical context.
   *
   * Format follows IANA Time Zone Database identifiers such as
   * "America/New_York", "Asia/Seoul", "Europe/London", "Pacific/Auckland", etc.
   * Platform detection: `Intl.DateTimeFormat().resolvedOptions().timeZone`
   *
   * @default System timezone or "UTC" if unavailable
   */
  timezone?: string;

  /**
   * Backoff strategy for retrying failed operations.
   *
   * Defines the logic for retrying failed operations when the agent encounters
   * errors. This includes retrying function calls, API requests, and other
   * operations that may fail due to temporary issues.
   */
  backoffStrategy?: (props: { count: number; error: unknown }) => number;
}
