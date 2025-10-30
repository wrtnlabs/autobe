/**
 * Comprehensive metrics for AI agent function calling operations.
 *
 * This interface tracks the complete execution history of AI agent function
 * calling attempts, categorizing each execution by its outcome: successful
 * completion, user consent requests, validation failures, or JSON parsing
 * errors. These metrics provide comprehensive visibility into agent reliability
 * and tool usage effectiveness across the AutoBE pipeline.
 *
 * Function calling metrics are fundamental to monitoring the self-healing
 * spiral loops in AutoBE's compiler-driven development model. When agents make
 * function calls to tools like schema generation or code writing, each attempt
 * is recorded here, enabling analysis of autonomous operation quality and
 * identification of problematic patterns that may require prompt optimization.
 *
 * The metric data supports calculation of success rates, failure rate analysis,
 * and identification of operations where agents struggle with tool interfaces,
 * guiding systematic improvements to system prompts and tool designs.
 *
 * @author Samchon
 */
export interface AutoBeFunctionCallingMetric {
  /**
   * Total number of function calling attempts.
   *
   * Represents the complete count of all function call executions by the AI
   * agent, regardless of outcome. This baseline metric enables calculation of
   * success rates and overall agent activity levels.
   */
  total: number;

  /**
   * Number of successful function calls.
   *
   * Counts function calls that completed successfully with valid responses that
   * passed all validation rules. High success rates indicate effective system
   * prompts and well-designed tool interfaces.
   */
  success: number;

  /**
   * Number of function calls that required user consent.
   *
   * Counts function calls where the AI agent requested explicit user permission
   * before executing sensitive or critical operations. Consent requests ensure
   * user control over potentially impactful actions while maintaining
   * autonomous operation for routine tasks.
   *
   * High consent rates may indicate overly cautious agent behavior, while zero
   * consent requests in sensitive contexts may suggest insufficient safety
   * checks in system prompts.
   */
  consent: number;

  /**
   * Number of function calls that failed validation.
   *
   * Counts function calls that produced structurally valid JSON but failed
   * business logic or schema validation rules. These failures trigger
   * correction loops where the agent receives diagnostic feedback and retries
   * with fixes.
   */
  validationFailure: number;

  /**
   * Number of function calls that produced invalid JSON.
   *
   * Counts function calls where the agent's response could not be parsed as
   * valid JSON, indicating fundamental formatting errors. These are the most
   * severe failures, often requiring multiple correction attempts.
   */
  invalidJson: number;
}
