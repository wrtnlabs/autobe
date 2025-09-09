export interface IAutoBeTestCorrectTypiaTagApplication {
  /**
   * Rewrite function to fix Typia tag-related compilation errors.
   *
   * This function is called when the agent detects TypeScript compilation errors
   * related to Typia validation tags. The agent will correct improper tag syntax,
   * missing tags, or malformed tag values while preserving the validation intent.
   *
   * @param props - The analysis and correction properties
   * @param props.think - Analysis of the specific Typia tag issue causing the error
   * @param props.draft - Initial corrected code with proper Typia tag syntax
   * @param props.revise - Review process and final code with all tags properly formatted
   */
  rewrite(props: IAutoBeTestCorrectTypiaTagApplication.IProps): void;
}
export namespace IAutoBeTestCorrectTypiaTagApplication {
  /**
   * Properties for the rewrite function containing the analysis and correction workflow.
   */
  export interface IProps {
    /** 
     * Initial analysis phase.
     * 
     * Contains the agent's analysis of what specific Typia tag issue
     * (syntax error, missing tag, malformed value) is causing the compilation error.
     */
    think: string;

    /** 
     * Draft correction phase.
     * 
     * The initial corrected code with Typia tags properly formatted
     * according to Typia's JSDoc syntax requirements.
     */
    draft: string;

    /** 
     * Review and finalization phase.
     * 
     * Contains the review of tag corrections made and the final code
     * with all Typia validation tags properly implemented.
     */
    revise: IReviseProps;
  }

  /**
   * Properties for the revision phase of the correction process.
   */
  export interface IReviseProps {
    /**
     * Review of the tag corrections.
     * 
     * Brief explanation of what Typia tag issues were fixed,
     * including syntax corrections and validation logic preservation.
     */
    review: string;

    /**
     * Final corrected code.
     * 
     * The complete code with all Typia tags properly formatted
     * and ready for TypeScript compilation with Typia transformer.
     */
    final: string;
  }
}
