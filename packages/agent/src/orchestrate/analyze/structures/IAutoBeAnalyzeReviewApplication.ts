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
  /**
   * Document review validation checklist
   */
  export interface IReviewChecklist {
    /**
     * Document length is between 2,000 and 6,000 characters (excluding table
     * of contents)
     */
    hasProperLength: boolean;

    /**
     * Mermaid diagram syntax is correct (no parentheses inside square
     * brackets)
     */
    hasMermaidSyntaxCorrect: boolean;

    /** No parentheses () inside square brackets [] in Mermaid node labels */
    noParenthesesInBrackets: boolean;

    /** Document has proper structure with introduction, body, and conclusion */
    hasProperStructure: boolean;

    /** Document contains no questions to the reader at the end */
    noQuestionsInContent: boolean;

    /** Document is complete and standalone without interactive elements */
    isStandaloneDocument: boolean;

    /** All sections listed in table of contents are fully written */
    allSectionsComplete: boolean;

    /** All internal anchor links point to existing headings */
    internalLinksValid: boolean;
  }

  export interface IReject {
    /**
     * The reason why you reject the document and the suggestion for the
     * modification. You can write the reason in detail.
     */
    reason: string;

    /** Checklist for document review validation */
    checklist: IReviewChecklist;
  }

  export interface IAccept {
    reason: string;
  }
}

export type IOrchestrateAnalyzeReviewerResult =
  | {
      type: "reject";
      value: string;
      checklist?: IAutoBeAnalyzeReviewApplication.IReject["checklist"];
    }
  | {
      type: "accept";
    };