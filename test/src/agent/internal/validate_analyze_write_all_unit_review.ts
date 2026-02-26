import { AutoBeAgent } from "@autobe/agent";
import {
  AutoBeAnalyzeUnitReviewEvent,
  AutoBeExampleProject,
} from "@autobe/interface";

import { validate_analyze_write_unit_review } from "./validate_analyze_write_unit_review";

export const validate_analyze_write_all_unit_review = async (props: {
  agent: AutoBeAgent;
  vendor: string;
  project: AutoBeExampleProject;
}): Promise<AutoBeAnalyzeUnitReviewEvent> =>
  // Legacy compatibility wrapper: cross-file review is now `analyzeUnitReview`.
  validate_analyze_write_unit_review(props);
