import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeProgressEventBase } from "./AutoBeProgressEventBase";
import { AutoBeTokenUsageEventBase } from "./AutoBeTokenUsageEventBase";

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
  extends AutoBeEventBase<"realizeCorrect">,
    AutoBeProgressEventBase,
    AutoBeTokenUsageEventBase {
  /**
   * Name of the implementation file that has been corrected and finalized.
   *
   * Specifies the filename of the TypeScript implementation file that was
   * corrected. This may represent service classes, business logic modules,
   * DAOs, or integration handlers that initially failed validation and have now
   * been successfully revised.
   */
  location: string;

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
   * Iteration number of the requirements analysis this corrected file
   * corresponds to.
   *
   * Ensures that the correction reflects the latest understanding of the
   * business requirements and that code remains synchronized with current
   * objectives.
   */
  step: number;
}
