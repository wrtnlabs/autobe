/**
 * Interface representing comprehensive token usage statistics across all AI
 * agents in the vibe coding system.
 *
 * This interface provides detailed tracking of token consumption throughout the
 * entire automated development pipeline, enabling cost monitoring, performance
 * analysis, and optimization of AI resource utilization. The token usage data
 * captures both aggregate statistics and component-specific breakdowns across
 * different agent types and processing phases.
 *
 * Token usage tracking is essential for understanding the computational costs
 * of the vibe coding process and optimizing AI agent efficiency while
 * maintaining high-quality output across requirements analysis, database
 * design, API specification, testing, and implementation phases.
 *
 * @author Samchon
 * @author SunRabbit123
 */
export interface IAutoBeTokenUsageJson {
  /**
   * Aggregated token usage statistics across all agents.
   *
   * Provides a unified view of token consumption by combining data from all
   * processing phases in the vibe coding pipeline. This computed property
   * dynamically calculates the sum of all agent components (facade, analyze,
   * prisma, interface, test, realize) whenever accessed, ensuring the aggregate
   * always reflects the current state of token usage.
   *
   * The aggregation performs element-wise addition across all token metrics,
   * including total counts, input breakdowns with cache statistics, and output
   * categorizations by generation type. This comprehensive view enables overall
   * cost assessment and resource utilization analysis for the entire automated
   * development session.
   */
  aggregate: IAutoBeTokenUsageJson.IComponent;

  /**
   * Token usage for the facade agent orchestrating the entire pipeline.
   *
   * Tracks tokens consumed by the initial agent that coordinates and manages
   * the overall vibe coding process, including request parsing and response
   * orchestration.
   */
  facade: IAutoBeTokenUsageJson.IComponent;

  /**
   * Token usage for the requirements analysis agent.
   *
   * Captures tokens used during the analysis phase where user requirements are
   * processed, understood, and transformed into structured specifications for
   * subsequent development phases.
   */
  analyze: IAutoBeTokenUsageJson.IComponent;

  /**
   * Token usage for the Prisma database schema generation agent.
   *
   * Records tokens consumed while designing and generating database schemas,
   * including entity relationships, field definitions, and database-specific
   * optimizations.
   */
  prisma: IAutoBeTokenUsageJson.IComponent;

  /**
   * Token usage for the API interface specification agent.
   *
   * Tracks tokens used in creating OpenAPI/Swagger specifications, defining
   * endpoints, request/response structures, and API documentation.
   */
  interface: IAutoBeTokenUsageJson.IComponent;

  /**
   * Token usage for the test code generation agent.
   *
   * Monitors tokens consumed during automated test creation, including scenario
   * planning, test case generation, and end-to-end test implementation.
   */
  test: IAutoBeTokenUsageJson.IComponent;

  /**
   * Token usage for the implementation realization agent.
   *
   * Captures tokens used in the final implementation phase where actual
   * business logic, controllers, services, and integration code are generated.
   */
  realize: IAutoBeTokenUsageJson.IComponent;
}

export namespace IAutoBeTokenUsageJson {
  /**
   * Detailed token usage component with comprehensive input and output
   * breakdowns.
   *
   * Provides granular tracking of token consumption for a specific agent or
   * processing phase, including detailed analysis of input tokens (with caching
   * considerations) and output tokens (with different generation types). This
   * detailed breakdown enables precise cost analysis and performance
   * optimization.
   */
  export interface IComponent {
    /**
     * Total token usage combining all input and output tokens.
     *
     * Represents the complete token consumption for this component, providing a
     * single metric for overall resource utilization that can be used for cost
     * calculations and performance comparisons across different agents and
     * processing phases.
     */
    total: number;

    /**
     * Detailed breakdown of input token consumption.
     *
     * Provides specific analysis of tokens used for input processing, including
     * both fresh token consumption and cached token reuse. This breakdown helps
     * understand the efficiency of caching mechanisms and input processing
     * optimization opportunities.
     */
    input: IInput;

    /**
     * Detailed breakdown of output token generation.
     *
     * Provides specific analysis of tokens used for output generation,
     * including different types of generation such as reasoning, predictions,
     * and rejected alternatives. This breakdown helps understand the AI's
     * processing efficiency and quality of generated content.
     */
    output: IOutput;
  }

  /**
   * Detailed input token usage statistics with caching analysis.
   *
   * Provides comprehensive tracking of input token consumption, distinguishing
   * between fresh token processing and cached token reuse. This analysis is
   * crucial for understanding the efficiency of context caching and optimizing
   * input processing strategies to reduce computational costs.
   */
  export interface IInput {
    /**
     * Total amount of input tokens consumed.
     *
     * Represents the complete input token usage including both newly processed
     * tokens and cached tokens that were reused from previous operations. This
     * total provides the baseline for input processing cost analysis.
     */
    total: number;

    /**
     * Number of tokens that were served from cache.
     *
     * Indicates how many input tokens were reused from previous processing
     * through caching mechanisms, reducing computational costs and improving
     * response times. Higher cached token usage indicates more efficient
     * resource utilization and better system optimization.
     */
    cached: number;
  }

  /**
   * Detailed output token usage statistics with generation type analysis.
   *
   * Provides comprehensive tracking of output token generation, categorizing
   * tokens by their generation type and purpose. This analysis helps understand
   * the AI's reasoning process, prediction accuracy, and overall efficiency in
   * generating high-quality responses and development artifacts.
   */
  export interface IOutput {
    /**
     * Total amount of output tokens generated.
     *
     * Represents the complete output token generation including all types of
     * generated content such as reasoning, accepted predictions, and rejected
     * alternatives. This total provides the baseline for output generation cost
     * analysis and quality assessment.
     */
    total: number;

    /**
     * Number of tokens used for reasoning and analysis.
     *
     * Indicates how many tokens were consumed during the AI's internal
     * reasoning process, including analysis, planning, and decision-making
     * activities that contribute to generating high-quality responses but are
     * not directly visible in the final output.
     */
    reasoning: number;

    /**
     * Number of tokens from predictions that were accepted.
     *
     * Represents tokens generated through predictive mechanisms that were
     * validated and accepted as part of the final response. Higher accepted
     * prediction rates indicate more efficient generation and better prediction
     * accuracy in the AI processing pipeline.
     */
    accepted_prediction: number;

    /**
     * Number of tokens from predictions that were rejected.
     *
     * Represents tokens generated through predictive mechanisms that were
     * subsequently rejected or replaced during the generation process. While
     * these tokens contribute to computational cost, they also indicate the
     * AI's quality control and self-correction mechanisms.
     */
    rejected_prediction: number;
  }
}
