export interface IAutoBeAnalyzeReviewApplication {
  /**
   * If there is anything that needs to be modified, you can call it, This
   * function is to reject the document for to try rewriting document with your
   * advice or suggestion.
   */
  reject(input: IAutoBeAnalyzeReviewApplication.IReject): "OK" | Promise<"OK">;

  /**
   * If you decide that you no longer need any reviews, call accept. This is a
   * function to end document creation and review, and to respond to users.
   */
  accept(): "OK" | Promise<"OK">;
}

export namespace IAutoBeAnalyzeReviewApplication {
  export interface IReject {
    /**
     * The reason why you reject the document and the suggestion for the
     * modification. You can write the reason in detail.
     */
    reason: string;
  }
}

export type IOrchestrateAnalyzeReviewerResult =
  | {
      type: "reject";
      value: string;
    }
  | {
      type: "accept";
    };
