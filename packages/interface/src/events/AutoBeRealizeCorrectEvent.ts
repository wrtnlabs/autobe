import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Realize agent corrects and finalizes a faulty
 * implementation file during the code generation process.
 *
 * This event is triggered after the AI detects issues such as compilation
 * errors or logic flaws in an implementation file and successfully applies
 * corrections. The corrected implementation is then finalized and emitted as
 * part of the application’s development process.
 *
 * Unlike the initial write event, this correction event reflects the AI's
 * self-improving feedback loop — demonstrating how it revisits and enhances
 * previously written code to meet quality standards and business requirements.
 *
 * @author Samchon
 */
export interface AutoBeRealizeCorrectEvent
  extends AutoBeEventBase<"realizeCorrect"> {
  /**
   * Name of the implementation file that has been corrected and finalized.
   *
   * Specifies the filename of the TypeScript implementation file that was
   * corrected. This may represent service classes, business logic modules,
   * DAOs, or integration handlers that initially failed validation and have now
   * been successfully revised.
   */
  filename: string;

  /**
   * Corrected content of the implementation file.
   *
   * Contains the finalized TypeScript code that was previously incorrect but
   * has now been updated to compile and align with project requirements. This
   * code bridges the gap between the flawed implementation and a working
   * production-quality version.
   */
  content: string;

  /**
   * Number of corrected implementation files so far.
   *
   * Indicates how many implementation files have been successfully revised as
   * part of the correction phase. Useful for tracking iterative progress in the
   * post-generation validation cycle.
   */
  completed: number;

  /**
   * Total number of implementation files that require correction.
   *
   * Represents the total scope of files identified for revision, providing a
   * clear view of correction workload and completeness.
   */
  total: number;

  /**
   * Iteration number of the requirements analysis this corrected file
   * corresponds to.
   *
   * Ensures that the correction reflects the latest understanding of the
   * business requirements and that code remains synchronized with current
   * objectives.
   */
  step: number;
}
