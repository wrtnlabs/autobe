import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeAnalyzeReview extends AutoBeEventBase<"analyzeReview"> {
  review: string;
  step: number;
}
