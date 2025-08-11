import { AutoBeAnalyzeRole } from "../histories/contents/AutoBeAnalyzeRole";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event interface for analyze composition operations Used when composing
 * multiple analysis results from different agents
 *
 * @author Kakasoo
 */
export interface AutoBeAnalyzeScenarioEvent
  extends AutoBeEventBase<"analyzeScenario"> {
  /** Current page number in the analysis process */
  page: number;
  /** List of filenames being analyzed */
  filenames: string[];
  /** Array of roles involved in the analysis */
  roles: AutoBeAnalyzeRole[];
  /** Current step in the analysis workflow */
  step: number;
  prefix: string;
}
