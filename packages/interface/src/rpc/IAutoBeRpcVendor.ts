/**
 * Interface representing AI vendor configuration for vibe coding operations.
 *
 * This interface defines the essential configuration required to connect with
 * AI service providers that power the vibe coding pipeline. Different AI
 * vendors may offer varying capabilities, performance characteristics, and
 * pricing models, allowing users to choose the most appropriate AI service for
 * their specific development needs and requirements.
 *
 * The vendor configuration enables the vibe coding system to interact with
 * multiple AI providers while maintaining consistent functionality across the
 * entire automated development workflow from requirements analysis through
 * final implementation.
 *
 * @author Samchon
 */
export interface IAutoBeRpcVendor {
  /**
   * AI model identifier specifying which model to use for vibe coding
   * operations.
   *
   * Specifies the exact model name or identifier that should be used for
   * AI-powered development tasks. Different models may offer varying levels of
   * capability, performance, and cost efficiency. Common examples include
   * "gpt-4", "gpt-3.5-turbo", "claude-3-sonnet", or other provider-specific
   * model identifiers.
   *
   * The choice of model can significantly impact the quality of generated code,
   * accuracy of requirements analysis, and overall effectiveness of the vibe
   * coding process.
   */
  model: string;

  /**
   * Authentication API key for accessing the AI vendor's services.
   *
   * Provides the necessary authentication credentials to access the specified
   * AI vendor's API services. This key should be kept secure and have
   * appropriate permissions for the intended AI operations including text
   * generation, function calling, and other AI capabilities required for the
   * vibe coding pipeline.
   *
   * The API key typically determines usage limits, billing, and access to
   * specific model capabilities within the vendor's service ecosystem.
   */
  apiKey: string;

  /**
   * Optional custom base URL for the AI vendor's API endpoint.
   *
   * Allows specification of alternative API endpoints when using custom
   * deployments, enterprise instances, or proxy services instead of the
   * vendor's default public API endpoint. This flexibility enables integration
   * with private AI deployments, regional endpoints, or custom API gateways.
   *
   * If not specified, the system will use the vendor's standard public API
   * endpoint based on the configured model and vendor detection.
   */
  baseURL?: string;
}
