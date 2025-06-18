import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeAnalyzeReviewEvent
  extends AutoBeEventBase<"analyzeReview"> {
  review: string;
  step: number;
}
