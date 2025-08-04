import { IAutoBeTokenUsageJson } from "@autobe/interface";

/**
 * Token usage component for individual AI agents in the vibe coding pipeline.
 *
 * Represents detailed token consumption statistics for a specific processing
 * phase (facade, analyze, prisma, interface, test, or realize). This class
 * tracks both input and output token usage with granular breakdowns, enabling
 * precise cost analysis and performance optimization for each agent.
 *
 * The component structure includes:
 *
 * - Total token count for quick cost calculations
 * - Input token breakdown with cache efficiency metrics
 * - Output token categorization by generation type
 *
 * This granular tracking helps identify optimization opportunities and
 * understand the computational characteristics of each agent phase.
 *
 * @author SunRabbit123
 */
export class AutoBeTokenUsageComponent
  implements IAutoBeTokenUsageJson.IComponent
{
  /**
   * Detailed breakdown of input token consumption.
   *
   * Tracks how many tokens were processed as input to the AI agent, including:
   *
   * - Total input tokens processed
   * - Cached tokens that were reused from previous operations
   *
   * The cache efficiency (cached/total ratio) indicates how well the system is
   * reusing context across multiple invocations.
   */
  public readonly input: IAutoBeTokenUsageJson.IInput;

  /**
   * Detailed breakdown of output token generation.
   *
   * Categorizes generated tokens by their purpose and acceptance status:
   *
   * - Total output tokens generated
   * - Reasoning tokens (internal processing)
   * - Accepted prediction tokens (efficient generation)
   * - Rejected prediction tokens (quality control overhead)
   *
   * These metrics help understand the AI's generation efficiency and the
   * effectiveness of its predictive mechanisms.
   */
  public readonly output: IAutoBeTokenUsageJson.IOutput;

  /**
   * Total token count combining all input and output tokens.
   *
   * Represents the complete token consumption for this component, providing a
   * single metric for overall resource utilization. This value is critical for
   * cost calculations and comparing efficiency across different agents or
   * processing phases.
   */
  public get total(): number {
    return this.input.total + this.output.total;
  }

  /* -----------------------------------------------------------
    CONSTRUCTORS
  ----------------------------------------------------------- */
  /**
   * Default Constructor.
   *
   * Creates a new token usage component with all counters initialized to zero.
   * Constructs fresh input and output objects with default values, providing a
   * clean starting point for tracking token consumption in an agent phase.
   */
  public constructor();

  /**
   * Initializer Constructor.
   *
   * Creates a new component populated with existing token usage data. Directly
   * assigns the provided values to instance properties, preserving the exact
   * token counts and structure from the source data for accurate tracking
   * continuation.
   *
   * @param props - Token usage data to initialize the component
   */
  public constructor(props: IAutoBeTokenUsageJson.IComponent);

  public constructor(props?: IAutoBeTokenUsageJson.IComponent) {
    if (props === undefined) {
      this.input = { total: 0, cached: 0 };
      this.output = {
        total: 0,
        reasoning: 0,
        accepted_prediction: 0,
        rejected_prediction: 0,
      };
      return;
    }
    this.input = props.input;
    this.output = props.output;
  }

  /**
   * Export token usage data as JSON.
   *
   * Converts the component's token usage statistics to the standardized
   * IAutoBeTokenUsageJson.IComponent format. This serialization maintains the
   * complete structure including total counts and detailed breakdowns for both
   * input and output tokens.
   *
   * @returns JSON representation of the token usage component
   */
  public toJSON(): IAutoBeTokenUsageJson.IComponent {
    return {
      total: this.total,
      input: this.input,
      output: this.output,
    };
  }

  /* -----------------------------------------------------------
    OPERATORS
  ----------------------------------------------------------- */
  /**
   * Add token usage data to current statistics.
   *
   * Increments all token counters in this component by the corresponding values
   * from the provided component data. This method performs in-place updates,
   * modifying the current instance rather than creating a new one.
   *
   * Updates include:
   *
   * - Total token count
   * - Input tokens (both total and cached)
   * - Output tokens (reasoning, accepted/rejected predictions)
   *
   * @param props - Token usage component data to add to current values
   */
  public increment(props: IAutoBeTokenUsageJson.IComponent) {
    this.input.total += props.input.total;
    this.input.cached += props.input.cached;
    this.output.total += props.output.total;
    this.output.reasoning += props.output.reasoning;
    this.output.accepted_prediction += props.output.accepted_prediction;
    this.output.rejected_prediction += props.output.rejected_prediction;
  }

  /**
   * Create new component combining two token usage statistics.
   *
   * Performs element-wise addition of all token counters from two components,
   * creating a new AutoBeTokenUsageComponent instance with the combined totals.
   * This static method is useful for aggregating token usage across multiple
   * agent invocations or combining statistics from parallel processing.
   *
   * @param a - First token usage component
   * @param b - Second token usage component
   * @returns New component with combined token statistics
   */
  public static plus(
    a: AutoBeTokenUsageComponent,
    b: AutoBeTokenUsageComponent,
  ) {
    return new AutoBeTokenUsageComponent({
      total: a.total + b.total,
      input: {
        total: a.input.total + b.input.total,
        cached: a.input.cached + b.input.cached,
      },
      output: {
        total: a.output.total + b.output.total,
        reasoning: a.output.reasoning + b.output.reasoning,
        accepted_prediction:
          a.output.accepted_prediction + b.output.accepted_prediction,
        rejected_prediction:
          a.output.rejected_prediction + b.output.rejected_prediction,
      },
    });
  }
}
