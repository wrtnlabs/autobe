import { AutoBeException } from "../exceptions";
import { AutoBeHistory } from "../histories";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event interface emitted when an exception occurs during AutoBE execution.
 * This event is triggered when an error occurs during AutoBE's waterfall
 * development process.
 */
export interface AutoBeExceptionEvent extends AutoBeEventBase<"exception"> {
  /**
   * Detailed information about the exception that occurred. Contains the cause,
   * message, stack trace, etc. as AutoBeException type.
   */
  exception: AutoBeException;

  /**
   * Map of all files created before the exception occurred. Key: file path,
   * Value: file content Preserves the state of generated files for debugging
   * and recovery purposes.
   */
  files: Record<string, string>;

  /**
   * Array of AutoBE execution history up to the point of exception. Includes
   * execution records from each agent (Analyze, Prisma, Interface, Test,
   * Realize). Used for problem tracking and debugging.
   */
  histories: AutoBeHistory[];

  /**
   * The execution step number where the exception occurred. Identifies which
   * stage in AutoBE's waterfall process encountered the problem.
   */
  step: number;
}
