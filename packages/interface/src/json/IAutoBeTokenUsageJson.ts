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
 * This comment written by @Samchon
 *
 * @author sunrabbit123
 */
export interface IAutoBeTokenUsageJson {
  /**
   * Aggregated token usage across all AI agents and processing phases.
   *
   * Provides the total token consumption for the entire vibe coding session,
   * combining all input and output tokens used by every agent throughout the
   * development pipeline. This aggregate view enables overall cost assessment
   * and resource utilization analysis for complete project automation.
   */
  facade: IAutoBeInternalTokenUsageJson;

  /** Token usage for the analysis phase */
  analyze: IAutoBeInternalTokenUsageJson;
  /** Token usage for the Prisma schema generation phase */
  prisma: IAutoBeInternalTokenUsageJson;
  /** Token usage for the interface generation phase */
  interface: IAutoBeInternalTokenUsageJson;
  /** Token usage for the test generation phase */
  test: IAutoBeInternalTokenUsageJson;
  /** Token usage for the implementation phase */
  realize: IAutoBeInternalTokenUsageJson;
}

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
 */
export interface IAutoBeInternalTokenUsageJson {
  /**
   * Total sum of token usage for each stage in the internal agent.
   *
   * Represents the total token consumption across all internal agent stages
   * including initialization, selection, cancellation, calling, and
   * description. This enables monitoring and analysis of resource usage at each
   * stage of the process.
   */
  aggregate: IAutoBeTokenUsageJson.IComponent;

  /**
   * Token usage of the initializer agent responsible for session setup.
   *
   * Tracks token consumption during the initialization phase where the system
   * prepares for the vibe coding session, sets up context, and establishes the
   * foundation for subsequent agent operations. This includes initial
   * conversation processing and system preparation activities.
   */
  initialize: IAutoBeTokenUsageJson.IComponent;

  /**
   * Token usage of the function selector agent that determines appropriate
   * actions.
   *
   * Monitors token consumption during the decision-making process where the
   * system analyzes user input and determines which specific agent functions
   * should be called to address the user's needs. This includes conversation
   * analysis and agent selection logic processing.
   */
  select: IAutoBeTokenUsageJson.IComponent;

  /**
   * Token usage of the function canceler agent that handles operation
   * termination.
   *
   * Tracks token consumption when operations need to be cancelled or
   * terminated, including the analysis required to safely stop ongoing
   * processes and communicate cancellation status to users. This includes
   * cleanup and state management activities.
   */
  cancel: IAutoBeTokenUsageJson.IComponent;

  /**
   * Token usage of the function caller agent that executes selected operations.
   *
   * Monitors token consumption during the actual execution of agent functions,
   * including the processing required to invoke specific development agents
   * (Analyze, Prisma, Interface, Test, Realize) and coordinate their activities
   * throughout the vibe coding pipeline.
   */
  call: IAutoBeTokenUsageJson.IComponent;

  /**
   * Token usage of the function calling describer agent that explains
   * operations.
   *
   * Tracks token consumption when generating descriptions and explanations of
   * function calling activities, helping users understand what operations are
   * being performed and providing transparency into the automated development
   * process through clear communication.
   */
  describe: IAutoBeTokenUsageJson.IComponent;
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
   *
   * @author Samchon
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
   *
   * @author Samchon
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
   *
   * @author Samchon
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
