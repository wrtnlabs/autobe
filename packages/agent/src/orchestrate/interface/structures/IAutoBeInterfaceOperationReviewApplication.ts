import { tags } from "typia";

export interface IAutoBeInterfaceOperationReviewApplication {
  reviewOperations(
    input: IAutoBeInterfaceOperationReviewApplication.IProps,
  ): void;
}
export namespace IAutoBeInterfaceOperationReviewApplication {
  export interface IProps {
    reviews: IReview[];
  }

  export interface IReview {
    method: string;
    path: string;
    passed: boolean;
    reason: (string & tags.MinLength<10>) | null;
  }
}
