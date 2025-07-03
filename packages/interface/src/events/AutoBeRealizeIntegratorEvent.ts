import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeRealizeIntegratorEvent
  extends AutoBeEventBase<"realizeIntegrator"> {
  /**
   * The step number of the requirements analysis this implementation was
   * completed for.
   */
  step: number;

  /** The files to integrate the code into. */
  file: Record<string, string>;

  /**
   * Indicates the result of the integration process.
   *
   * - "success": The function was correctly inserted, imported, and passed
   *   compilation.
   * - "fail": The integration did not complete (e.g., target controller not
   *   found, syntax error).
   * - "exception": An unexpected error occurred (e.g., I/O failure, invalid
   *   context state).
   */
  result: "success" | "fail" | "exception";
}
