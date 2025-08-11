import { AutoBeAnalyzeFile } from "../histories/contents/AutoBeAnalyzeFile";
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
  files: Array<Omit<AutoBeAnalyzeFile, "content">>;
  roles: AutoBeAnalyzeRole[];
  /** Current step in the analysis workflow */
  step: number;
  prefix: string;
}
