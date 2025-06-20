import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Analyze agent begins the requirements analysis process.
 *
 * This event marks the initiation of the structured requirements analysis
 * workflow, signaling that the agent is starting to draft the comprehensive
 * analysis report. The start event represents the beginning of the critical
 * foundation phase that transforms user conversations and business needs into
 * structured documentation for the entire vibe coding pipeline.
 *
 * The analysis process that begins with this event will proceed through
 * drafting, reviewing, and finalizing phases to produce the authoritative
 * requirements documentation that guides all subsequent development activities
 * including database design, API specification, and implementation.
 *
 * @author Kakasoo
 */
export interface AutoBeAnalyzeStartEvent
  extends AutoBeEventBase<"analyzeStart"> {
  /**
   * Reason why the Analyze agent was activated through function calling.
   *
   * Explains the specific circumstances that triggered the AI chatbot to invoke
   * the Analyze agent via function calling. This could include reasons such as
   * initial project requirements gathering, requests for requirement
   * clarification, updates to existing requirements based on user feedback, or
   * revision requests for the analysis report.
   *
   * Understanding the activation reason provides context for the analysis scope
   * and helps stakeholders understand whether this is an initial analysis or a
   * refinement of existing requirements.
   */
  reason: string;

  /**
   * Iteration number of the requirements analysis being started.
   *
   * Indicates which revision of the requirements analysis is beginning. A value
   * of 0 means this is the initial requirements analysis, while higher values
   * represent subsequent revisions being initiated based on user feedback,
   * additional requirements, or refinement needs.
   *
   * This step number helps track the iterative nature of requirements
   * development and provides context for understanding the evolution of project
   * requirements throughout the development process.
   */
  step: number;
}
