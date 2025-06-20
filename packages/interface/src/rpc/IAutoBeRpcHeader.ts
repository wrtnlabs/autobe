import { ILlmSchema } from "@samchon/openapi";

import { IAutoBeRpcVendor } from "./IAutoBeRpcVendor";

/**
 * Interface representing the WebSocket connection header for vibe coding
 * sessions.
 *
 * This interface defines the essential configuration and context information
 * that must be provided when establishing a WebSocket connection to the vibe
 * coding server. The header contains all necessary parameters for AI model
 * configuration, vendor authentication, and user context that enables
 * personalized and localized development experiences.
 *
 * In TGrid's RPC paradigm, the header is delivered from client to server after
 * connection establishment and is used to authenticate the client and configure
 * the session parameters for optimal vibe coding performance based on user
 * preferences and technical requirements.
 *
 * @author Samchon
 */
export interface IAutoBeRpcHeader<Model extends ILlmSchema.Model> {
  /**
   * AI model type specification for type-safe function calling schemas.
   *
   * Specifies the AI model type that determines the function calling schema
   * generation and optimization characteristics. This type parameter ensures
   * compile-time type safety and enables model-specific optimizations in the AI
   * function calling interface generation process through
   * [`typia.llm.application()`](https://typia.io/docs/llm/application).
   *
   * Different model types may have varying function calling capabilities,
   * parameter limitations, and schema requirements that need to be accounted
   * for during the vibe coding pipeline to ensure optimal AI performance and
   * compatibility.
   */
  model: Model;

  /**
   * AI vendor configuration for service provider integration.
   *
   * Contains the complete {@link IAutoBeRpcVendor} configuration including model
   * identifier, API authentication, and optional custom endpoints. This
   * configuration enables the vibe coding system to connect with the specified
   * AI service provider and utilize their capabilities throughout the automated
   * development pipeline.
   *
   * The vendor configuration determines which AI service will power the
   * requirements analysis, database design, API specification, testing, and
   * implementation phases of the vibe coding process.
   */
  vendor: IAutoBeRpcVendor;

  /**
   * User's locale preference for internationalized responses and communication.
   *
   * Specifies the language and cultural context for AI assistant responses,
   * ensuring that communication throughout the vibe coding process is delivered
   * in the user's preferred language. Common format follows ISO 639-1 language
   * codes such as "en", "ko", "ja", "zh", etc.
   *
   * Localization enhances the user experience by providing natural language
   * communication that respects cultural conventions and linguistic preferences
   * during the collaborative development process.
   */
  locale: string;

  /**
   * User's timezone for temporal context and scheduling considerations.
   *
   * Provides timezone information for proper handling of time-sensitive
   * operations, scheduling, and temporal context during the vibe coding
   * process. Format typically follows IANA timezone identifiers such as
   * "America/New_York", "Asia/Seoul", "Europe/London", etc.
   *
   * Timezone awareness ensures that timestamps, scheduling references, and
   * time-based communications are properly contextualized for the user's local
   * time and cultural expectations.
   */
  timezone: string;
}
