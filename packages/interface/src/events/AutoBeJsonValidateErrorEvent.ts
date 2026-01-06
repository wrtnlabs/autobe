import { IValidation } from "typia";

import { AutoBeEventSource } from "./AutoBeEventSource";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

/**
 * Event fired when an AI agent's function call output fails schema validation.
 *
 * This event occurs when an AI agent returns syntactically valid JSON through
 * function calling, but the data structure does not conform to the expected
 * TypeScript type definition or schema constraints. This represents a semantic
 * validation failure where the JSON is well-formed but contains incorrect
 * types, missing required fields, invalid values, or violates other schema
 * rules.
 *
 * Validation errors are distinguished from parse errors - this event handles
 * cases where JSON parsing succeeded but runtime type validation (via Typia)
 * detected schema violations. These errors indicate that the AI agent
 * misunderstood the expected data structure or made logical errors in
 * constructing the response.
 *
 * The event provides detailed validation failure information from Typia,
 * including specific paths to invalid properties and descriptions of constraint
 * violations. This enables the correction loop to provide precise feedback to
 * the agent for regenerating a schema-compliant response.
 *
 * @author Samchon
 */
export interface AutoBeJsonValidateErrorEvent
  extends AutoBeEventBase<"jsonValidateError"> {
  /**
   * Source agent or operation where the validation error occurred.
   *
   * Identifies which AutoBE agent or operation produced the JSON response that
   * failed schema validation. This helps track which part of the pipeline is
   * generating data structure issues and enables targeted improvements to
   * specific agent prompts or function definitions.
   */
  source: AutoBeEventSource;

  /**
   * Name of the function call that produced invalid schema output.
   *
   * Specifies which function the AI agent was attempting to call when it
   * generated the schema-violating response. This information is crucial for
   * diagnosing systematic issues with specific function calls and refining
   * the corresponding tool definitions, type constraints, or system prompts to
   * better guide the agent's response generation.
   */
  function: string;

  /**
   * Detailed validation failure result from Typia.
   *
   * Contains comprehensive diagnostic information about why the validation
   * failed, including:
   *
   * - Specific paths to invalid properties (e.g., "data.users[0].email")
   * - Expected type or constraint (e.g., "string & Format<'email'>")
   * - Actual value that violated the constraint
   * - Human-readable error messages for each violation
   *
   * This structured failure information enables the correction agent to provide
   * precise, actionable feedback to the AI agent for fixing the specific schema
   * violations in the next generation attempt.
   */
  result: IValidation.IFailure;

  /**
   * Retry attempt number for this function call.
   *
   * Tracks how many times this specific function call has been attempted and
   * failed schema validation. This counter enables intelligent retry logic,
   * escalation strategies, and prevents infinite retry loops by allowing the
   * system to give up after a reasonable number of validation failures.
   */
  life: number;
}
