import { AutoBeHistory, IAutoBeCompiler } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { IAutoBeConfig } from "./IAutoBeConfig";
import { IAutoBeVendor } from "./IAutoBeVendor";

/**
 * Configuration properties for initializing an AutoBeAgent instance.
 *
 * This interface defines all the essential parameters required to create and
 * configure an AutoBeAgent for vibe coding operations. The properties establish
 * the AI model capabilities, vendor connectivity, compilation infrastructure,
 * behavioral context, and optional session continuity through conversation
 * histories.
 *
 * The configuration enables type-safe AI function calling through
 * model-specific schema generation, ensures compatibility with various AI
 * service providers, and provides the compilation tools necessary for the
 * sophisticated AST-based development pipeline that transforms conversations
 * into working software.
 *
 * @author Samchon
 */
export interface IAutoBeProps<Model extends ILlmSchema.Model> {
  /**
   * AI model type specification for type-safe function calling schema
   * generation.
   *
   * Determines the specific AI model schema used for generating function
   * calling interfaces through
   * [`typia.llm.application()`](https://typia.io/docs/llm/application). This
   * type parameter ensures compile-time type safety and enables model-specific
   * optimizations in the AI function calling interface generation process.
   *
   * Common values include "chatgpt" for OpenAI models, "claude" for Anthropic
   * models, "deepseek" for DeepSeek models, and "llama" for Meta Llama models.
   * The choice affects function calling capabilities, parameter limitations,
   * and schema requirements throughout the vibe coding pipeline.
   *
   * Note that Google Gemini ("gemini") is not supported due to its lack of
   * reference types and union types support required for OpenAPI document
   * composition in the vibe coding process.
   */
  model: Model;

  /**
   * AI vendor configuration for service provider integration.
   *
   * Defines the complete AI service connection including the OpenAI SDK
   * instance, model identifier, request options, and concurrency controls. This
   * configuration enables the AutoBeAgent to connect with various AI providers
   * while maintaining consistent functionality across the entire automated
   * development workflow.
   *
   * The vendor settings determine the AI capabilities available for
   * requirements analysis, database design, API specification, testing, and
   * implementation phases of the vibe coding process.
   */
  vendor: IAutoBeVendor;

  /**
   * Compilation infrastructure for TypeScript, Prisma, and OpenAPI operations.
   *
   * Provides the essential compilation tools required for the sophisticated
   * AST-based development pipeline. The compiler handles validation,
   * transformation, and code generation across all development phases including
   * Prisma schema compilation, OpenAPI document validation, and TypeScript code
   * compilation.
   *
   * For high-performance scenarios with multiple concurrent users, the compiler
   * can be separated into dedicated worker processes to prevent blocking the
   * main agent during computationally intensive compilation operations.
   */
  compiler: IAutoBeCompiler;

  /**
   * Optional conversation and development histories for session continuation.
   *
   * Enables resuming previous vibe coding sessions by providing the
   * chronological record of past conversations, development activities, and
   * generated artifacts. When provided, the agent reconstructs its internal
   * state from these histories, allowing seamless continuation of development
   * work.
   *
   * This capability supports iterative development workflows where users can
   * return to modify, enhance, or extend previously generated applications
   * while maintaining full context of earlier decisions and implementations.
   */
  histories?: AutoBeHistory[] | undefined;

  /**
   * Optional behavioral configuration for localization and context.
   *
   * Customizes the agent's communication style, language preferences, and
   * geographical context to provide personalized vibe coding experiences.
   * Configuration includes locale settings for internationalized responses and
   * timezone information for temporal context awareness.
   *
   * These settings influence how the agent communicates with users, interprets
   * regional requirements (such as regulatory considerations), and handles
   * time-sensitive operations throughout the development process.
   */
  config?: IAutoBeConfig | undefined;
}
