import { AutoBeHistory } from "../histories";
import { AutoBeExceptionBase } from "./AutoBeExceptionBase";

/**
 * Exception interface for errors occurring during AI agent operations. This
 * exception is thrown when any of the AutoBE agents (Analyze, Prisma,
 * Interface, Test, Realize) encounters an error during their execution phase.
 */
export interface AutoBeAgenticaException
  extends AutoBeExceptionBase<"agentica"> {
  /**
   * Array of AutoBE history messages leading up to the exception. Contains the
   * conversation history between agents and the system, useful for debugging
   * the context in which the error occurred.
   */
  messages: AutoBeHistory[];

  /**
   * The actual error that occurred during agent execution. Type is 'unknown' to
   * handle various error types from different agents. May contain error
   * messages, stack traces, or other agent-specific error information.
   */
  error: unknown;
}
