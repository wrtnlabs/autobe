import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when an exception occurs during AutoBE process.
 *
 * This event is triggered when any of the AutoBE agents (Analyze, Prisma,
 * Interface, Test, Realize) encounters an error during their process. The
 * exception event captures the error details, including the type of exception,
 * the source of the error, and any relevant context that helps diagnose and
 * resolve the issue.
 *
 * The event provides comprehensive error tracking across the waterfall
 * development pipeline, enabling proper error handling, recovery strategies,
 * and debugging capabilities for both developers and end users.
 *
 * @author Michael
 */
export interface AutoBeExceptionEvent extends AutoBeEventBase<"exception"> {
  /**
   * The exception that occurred during the AutoBE process.
   *
   * Contains the specific exception details that occurred during the execution
   * of any AutoBE agent or compilation process. The exception data includes
   * error messages, stack traces, and any relevant context information that
   * helps diagnose and resolve the issue.
   */
  exception: unknown;

  /**
   * The source event type where the exception occurred.
   *
   * Identifies the specific AutoBE event that was being processed when the
   * error happened. This helps to quickly locate and understand the context of
   * the failure within the waterfall pipeline.
   *
   * Examples:
   *
   * - "analyze.write": Exception during requirements document writing
   * - "prisma.validate": Exception during Prisma schema validation
   * - "test.validate": Exception during test code compilation
   * - "realize.authorization.write": Exception during authorization decorator
   *   generation
   */
  source: string;
}
