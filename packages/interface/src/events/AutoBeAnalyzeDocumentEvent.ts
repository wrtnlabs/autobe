import { AutoBeAnalyzeDocumentSrs } from "../histories/contents/AutoBeAnalyzeDocumentSrs";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

/**
 * Event fired when the Semantic Layer (SRS) is extracted from a single analysis
 * file via LLM.
 *
 * The Evidence Layer is built programmatically, but the Semantic Layer requires
 * an LLM call to map the file's content to structured SRS categories. This
 * event carries the LLM-extracted SRS result.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentEvent
  extends AutoBeEventBase<"analyzeDocument">, AutoBeAggregateEventBase {
  /** The file index (0-based) within the fixed 6-file structure. */
  fileIndex: number;

  /** The filename of the analysis file. */
  filename: string;

  /** LLM-extracted Semantic Layer SRS data for this file. */
  srs: AutoBeAnalyzeDocumentSrs;

  /** Current step number in the analysis state machine. */
  step: number;
}
