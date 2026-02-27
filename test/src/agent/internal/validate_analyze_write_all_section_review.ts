import { AutoBeAgent } from "@autobe/agent";
import {
  AutoBeAnalyzeSectionReviewEvent,
  AutoBeExampleProject,
} from "@autobe/interface";

import { validate_analyze_write_section_review } from "./validate_analyze_write_section_review";

export const validate_analyze_write_all_section_review = async (props: {
  agent: AutoBeAgent;
  vendor: string;
  project: AutoBeExampleProject;
}): Promise<AutoBeAnalyzeSectionReviewEvent> =>
  // Legacy compatibility wrapper: cross-file/per-file review is now covered by
  // `analyzeSectionReview`.
  validate_analyze_write_section_review(props);
