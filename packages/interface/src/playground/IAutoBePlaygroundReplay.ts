import { AutoBeEventSnapshot } from "../events/AutoBeEventSnapshot";
import { AutoBeHistory } from "../histories/AutoBeHistory";
import { IAutoBeTokenUsageJson } from "../json";

/**
 * Interface representing replay data for vibe coding session playback.
 *
 * This interface captures the complete conversation and generation history from
 * an AutoBE vibe coding session, enabling users to replay, review, and analyze
 * the entire development process from requirements gathering through final
 * implementation. The replay functionality provides valuable insights into how
 * AI agents transform natural language conversations into working backend
 * applications.
 *
 * The replay data structure preserves both the conversation flow (histories)
 * and the detailed event snapshots from each development phase, allowing for
 * comprehensive analysis of the automated development pipeline's
 * decision-making process and incremental progress.
 *
 * @author Samchon
 */
export interface IAutoBePlaygroundReplay {
  /**
   * AI vendor identifier used for the vibe coding session.
   *
   * Specifies which AI service provider powered the session, such as "openai",
   * "anthropic", or other supported vendors. This information helps in
   * understanding performance characteristics and capabilities specific to
   * different AI models when analyzing replay data.
   */
  vendor: string;

  /**
   * Project name or identifier for the vibe coding session.
   *
   * Provides a unique identifier or descriptive name for the project being
   * developed during the session. This helps organize and distinguish between
   * multiple replay sessions when reviewing development history or comparing
   * different approaches to similar requirements.
   */
  project: string;

  /**
   * Complete chronological history of all user messages and agent responses.
   *
   * Contains the full conversation flow including user messages, assistant
   * responses, and all agent activities throughout the development process.
   * This comprehensive history enables reconstruction of the entire development
   * narrative from initial requirements to final implementation.
   */
  histories: AutoBeHistory[];

  /**
   * Event snapshots from the requirements analysis phase.
   *
   * Captures detailed events from the analyze agent's activities including
   * requirements parsing, scenario identification, and specification review.
   * Null if the session didn't reach the analysis phase or if snapshot data
   * wasn't captured for this phase.
   */
  analyze: AutoBeEventSnapshot[] | null;

  /**
   * Event snapshots from the database schema design phase.
   *
   * Records the prisma agent's incremental progress through schema planning,
   * model creation, relationship design, and compiler validation cycles. Null
   * if the session didn't reach the prisma phase or if snapshot data wasn't
   * captured for this phase.
   */
  prisma: AutoBeEventSnapshot[] | null;

  /**
   * Event snapshots from the API interface design phase.
   *
   * Documents the interface agent's API design process including endpoint
   * creation, operation definition, schema generation, and OpenAPI
   * specification validation. Null if the session didn't reach the interface
   * phase or if snapshot data wasn't captured.
   */
  interface: AutoBeEventSnapshot[] | null;

  /**
   * Event snapshots from the test code generation phase.
   *
   * Preserves the test agent's scenario planning and e2e test code generation
   * activities including test case design and validation cycles. Null if the
   * session didn't reach the test phase or if snapshot data wasn't captured for
   * this phase.
   */
  test: AutoBeEventSnapshot[] | null;

  /**
   * Event snapshots from the implementation realization phase.
   *
   * Contains the realize agent's code generation events including controller
   * implementation, service logic, authorization setup, and final integration.
   * Null if the session didn't reach the realize phase or if snapshot data
   * wasn't captured for this phase.
   */
  realize: AutoBeEventSnapshot[] | null;
}
export namespace IAutoBePlaygroundReplay {
  /**
   * Properties for identifying and accessing specific replay data.
   *
   * Defines the essential parameters needed to locate and retrieve replay data
   * for a specific vibe coding session and development phase. These properties
   * enable targeted access to replay information for analysis and review.
   */
  export interface IProps {
    /**
     * AI vendor identifier for the replay session.
     *
     * Specifies which AI service provider was used in the original vibe coding
     * session, enabling vendor-specific replay analysis and comparison.
     */
    vendor: string;

    /**
     * Project identifier for the replay session.
     *
     * Unique identifier or name that distinguishes this project's replay data
     * from other sessions in the replay repository.
     */
    project: string;

    /**
     * Development phase to replay or analyze.
     *
     * Specifies which phase of the waterfall development process to focus on
     * when retrieving or displaying replay data. Each phase represents a
     * distinct stage in the automated backend development pipeline.
     */
    phase: "analyze" | "prisma" | "interface" | "test" | "realize" | null;
  }

  /**
   * Summary statistics and metrics for a vibe coding replay session.
   *
   * Provides aggregated performance metrics and completion status for each
   * development phase, enabling quick assessment of session efficiency,
   * resource consumption, and overall success. This summary data is valuable
   * for optimization, benchmarking, and identifying potential improvements in
   * the vibe coding pipeline.
   */
  export interface ISummary extends IProps {
    /**
     * Aggregated token usage across all AI interactions.
     *
     * Comprehensive token consumption metrics including prompt tokens,
     * completion tokens, and total usage across all agents and phases. This
     * data helps in understanding resource utilization and optimizing AI model
     * usage for cost-effective development.
     */
    tokenUsage: IAutoBeTokenUsageJson;

    /**
     * Total elapsed time for the entire vibe coding session in milliseconds.
     *
     * Measures the complete duration from session start to final completion,
     * providing insights into overall development velocity and helping identify
     * optimization opportunities in the automated pipeline.
     */
    elapsed: number;

    /**
     * Summary state for the requirements analysis phase.
     *
     * Contains success status, timing, and event aggregation for the analyze
     * agent's activities. Null if this phase wasn't executed in the session.
     */
    analyze: IPhaseState | null;

    /**
     * Summary state for the database schema design phase.
     *
     * Provides metrics on the prisma agent's performance including schema
     * generation success, timing, and iteration counts. Null if this phase
     * wasn't reached.
     */
    prisma: IPhaseState | null;

    /**
     * Summary state for the API interface design phase.
     *
     * Captures the interface agent's performance metrics including API design
     * success, elapsed time, and operation counts. Null if this phase wasn't
     * executed.
     */
    interface: IPhaseState | null;

    /**
     * Summary state for the test generation phase.
     *
     * Documents the test agent's efficiency in generating e2e tests including
     * success rate, generation time, and scenario counts. Null if this phase
     * wasn't reached.
     */
    test: IPhaseState | null;

    /**
     * Summary state for the implementation phase.
     *
     * Summarizes the realize agent's code generation performance including
     * implementation success, total time, and component counts. Null if this
     * phase wasn't executed.
     */
    realize: IPhaseState | null;
  }

  /**
   * State and metrics for an individual development phase.
   *
   * Captures the execution results and performance characteristics of a
   * specific agent phase in the vibe coding pipeline. This granular data
   * enables detailed analysis of each phase's contribution to the overall
   * development process and helps identify bottlenecks or areas for
   * improvement.
   */
  export interface IPhaseState {
    /**
     * Indicates whether the phase completed successfully.
     *
     * True if the agent phase completed without errors and produced valid
     * outputs that passed all validation checks. False indicates the phase
     * encountered errors or failed validation, requiring investigation or
     * retry.
     */
    success: boolean;

    /**
     * Time taken to complete this phase in milliseconds.
     *
     * Measures the duration from phase initiation to completion, including all
     * AI interactions, validations, and corrections. This metric helps identify
     * performance characteristics of individual phases.
     */
    elapsed: number;

    /**
     * Aggregated event counts by event type for this phase.
     *
     * Provides a frequency distribution of different event types that occurred
     * during the phase execution. Keys represent event type names and values
     * indicate occurrence counts, offering insights into phase complexity and
     * AI interaction patterns.
     */
    aggregate: Record<string, number>;
  }

  export type Collection = Record<string, IAutoBePlaygroundReplay.ISummary[]>;
}
