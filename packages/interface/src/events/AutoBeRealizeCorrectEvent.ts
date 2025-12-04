import { AutoBeRealizeFunction } from "../histories";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

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
    AutoBeAggregateEventBase {
  kind: "casting" | "overall";

  function: AutoBeRealizeFunction;

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
