import { IJsonParseResult } from "typia";

import { AutoBeEventSource } from "./AutoBeEventSource";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

/**
 * Event fired when an AI agent's function call output fails JSON parsing.
 *
 * This event occurs when an AI agent returns structured data through function
 * calling that cannot be successfully parsed as valid JSON. This typically
 * indicates malformed JSON syntax such as missing quotes, trailing commas,
 * unclosed brackets, or other syntax violations that prevent the parser from
 * interpreting the response.
 *
 * JSON parse errors are distinguished from validation errors - this event
 * represents syntactic failures (invalid JSON structure) rather than semantic
 * failures (valid JSON with incorrect schema). When this error occurs, the
 * agent's response cannot be processed at all, requiring regeneration of the
 * entire response with proper JSON formatting.
 *
 * The event captures comprehensive diagnostic information including the source
 * agent, function name, raw arguments that failed to parse, and the specific
 * error message from the JSON parser, enabling effective debugging and
 * self-healing through the correction loop mechanism.
 *
 * @author Samchon
 */
export interface AutoBeJsonParseErrorEvent extends AutoBeEventBase<"jsonParseError"> {
  /**
   * Source agent or operation where the JSON parse error occurred.
   *
   * Identifies which AutoBE agent or operation produced the malformed JSON
   * response. This helps track which part of the pipeline is experiencing
   * issues and enables targeted improvements to specific agent prompts or
   * function definitions.
   */
  source: AutoBeEventSource;

  /**
   * Name of the function call that produced unparsable JSON output.
   *
   * Specifies which function the AI agent was attempting to call when it
   * generated the malformed JSON response. This information is crucial for
   * diagnosing systematic issues with specific function calls and refining the
   * corresponding tool definitions or system prompts.
   */
  function: string;

  failure: IJsonParseResult.IFailure;

  /**
   * Retry attempt number for this function call.
   *
   * Tracks how many times this specific function call has been attempted and
   * failed JSON parsing. This counter enables intelligent retry logic,
   * escalation strategies, and prevents infinite retry loops by allowing the
   * system to give up after a reasonable number of attempts.
   */
  life: number;
}
