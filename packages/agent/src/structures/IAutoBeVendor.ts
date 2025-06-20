import OpenAI from "openai";

/**
 * Interface representing AI vendor configuration for the AutoBeAgent.
 *
 * Defines the connection parameters and settings required to integrate with AI
 * service providers that power the vibe coding pipeline. While utilizing the
 * OpenAI SDK as the connection interface, this configuration supports various
 * LLM vendors beyond OpenAI through flexible endpoint and authentication
 * configuration, enabling integration with Claude, DeepSeek, Meta Llama, and
 * other providers that follow OpenAI-compatible API patterns.
 *
 * The vendor configuration determines the AI capabilities available throughout
 * the entire automated development workflow, from requirements analysis and
 * database design through API specification, testing, and final implementation.
 * Different vendors may offer varying performance characteristics, cost
 * structures, and feature support that can be optimized for specific vibe
 * coding needs.
 *
 * Concurrent request management is built-in to prevent API rate limiting and
 * optimize resource utilization across multiple development phases and parallel
 * operations within the vibe coding pipeline.
 *
 * @author Samchon
 */
export interface IAutoBeVendor {
  /**
   * OpenAI SDK instance configured for the target AI vendor.
   *
   * Provides the API connection interface used by the AutoBeAgent to
   * communicate with AI services. While this uses the OpenAI SDK, it can be
   * configured to connect with various LLM providers by setting the appropriate
   * `baseURL` and authentication credentials. The SDK serves as a universal
   * connector that abstracts the underlying API communication protocols.
   *
   * For non-OpenAI vendors, configure the SDK with the vendor's API endpoint
   * and authentication requirements to enable seamless integration with the
   * vibe coding system.
   */
  api: OpenAI;

  /**
   * Specific model identifier to use for AI operations.
   *
   * Specifies the exact model name or identifier that should be used for vibe
   * coding tasks. Supports both official OpenAI chat models and custom model
   * identifiers for third-party hosting services, cloud providers, or
   * alternative LLM vendors. The model choice significantly impacts the
   * quality, performance, and cost of the automated development process.
   *
   * Examples include "gpt-4", "gpt-3.5-turbo" for OpenAI, or vendor-specific
   * identifiers like "claude-3-sonnet", "deepseek-chat-v3", "llama3.3-70b" when
   * using alternative providers through compatible APIs.
   */
  model: OpenAI.ChatModel | ({} & string);

  /**
   * Optional request configuration for API calls.
   *
   * Additional request options that will be applied to all API calls made
   * through the OpenAI SDK. This can include custom headers, timeouts, retry
   * policies, or other HTTP client configuration that may be required for
   * specific vendor integrations or enterprise environments.
   *
   * These options provide fine-grained control over the API communication
   * behavior and can be used to optimize performance or meet specific
   * infrastructure requirements.
   */
  options?: OpenAI.RequestOptions | undefined;

  /**
   * Maximum number of concurrent API requests allowed.
   *
   * Controls the concurrency level for AI API calls to prevent rate limiting,
   * manage resource consumption, and optimize system performance. The vibe
   * coding pipeline may make multiple parallel requests during development
   * phases, and this setting ensures controlled resource utilization.
   *
   * A reasonable default provides balanced performance while respecting typical
   * API rate limits. Lower values reduce resource consumption but may slow
   * development progress, while higher values can improve performance but risk
   * hitting rate limits or overwhelming the AI service.
   *
   * Set to undefined to disable concurrency limiting, allowing unlimited
   * parallel requests (use with caution based on your API limits and
   * infrastructure capacity).
   *
   * @default 16
   */
  semaphore?: number | undefined;
}
