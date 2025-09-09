export interface IAutoBeTestCorrectInvalidRequestApplication {
  /**
   * Rewrite function to fix code containing invalid type API requests.
   *
   * This function is called when the agent detects code that attempts to send
   * API requests with deliberately wrong types, causing TypeScript compilation errors.
   * The agent will remove the problematic code sections while preserving valid test code.
   *
   * @param props - The analysis and correction properties
   * @param props.think - Analysis of what specific invalid request pattern is causing the error
   * @param props.draft - Initial corrected code with problematic sections removed
   * @param props.revise - Review process and final cleaned code
   */
  rewrite(props: IAutoBeTestCorrectInvalidRequestApplication.IProps): void;

  /**
   * Reject function when no invalid type API requests are detected.
   *
   * This function is called when the compilation error is not related to
   * invalid API request types, indicating the agent should not intervene.
   * The error might be caused by other issues that require different handling.
   */
  reject(): void;
}
export namespace IAutoBeTestCorrectInvalidRequestApplication {
  /**
   * Properties for the rewrite function containing the analysis and correction workflow.
   */
  export interface IProps {
    /** 
     * Initial analysis phase.
     * 
     * Contains the agent's analysis of what specific invalid request pattern
     * was found in the code and how it's causing the compilation error.
     */
    think: string;

    /** 
     * Draft correction phase.
     * 
     * The initial corrected code with the problematic API request sections
     * removed while preserving all valid test code.
     */
    draft: string;

    /** 
     * Review and finalization phase.
     * 
     * Contains the review of changes made and the final cleaned code
     * that should compile without the invalid API request errors.
     */
    revise: IReviseProps;
  }

  /**
   * Properties for the revision phase of the correction process.
   */
  export interface IReviseProps {
    /**
     * Review of the changes made.
     * 
     * Brief explanation of what invalid API request code was removed
     * and verification that valid test code was preserved.
     */
    review: string;

    /**
     * Final corrected code.
     * 
     * The complete, cleaned test code with all invalid API request
     * sections removed, ready for compilation.
     */
    final: string;
  }
}