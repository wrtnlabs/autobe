import typia from "typia";

/** Application interface for Date type correction in generated code */
export interface IAutoBeCommonCorrectDateApplication {
  /**
   * Rewrite the function to fix Date type issues
   *
   * @param props - Correction properties
   */
  rewrite(props: IAutoBeCommonCorrectDateApplication.IProps): void;

  /** Reject the correction task if Date issues cannot be fixed */
  reject(): void;
}

export namespace IAutoBeCommonCorrectDateApplication {
  /** Properties for Date type correction */
  export interface IProps {
    /** The correction revision containing the fixed code */
    revise: {
      /** Optional: Analysis of Date type errors found */
      analysis?: string & typia.tags.MaxLength<4000>;

      /** Optional: Strategy for fixing Date issues */
      strategy?: string & typia.tags.MaxLength<2000>;

      /**
       * Final corrected code with all Date type issues resolved
       *
       * Must follow these rules:
       *
       * - No ': Date' type declarations
       * - All dates use 'string & tags.Format<"date-time">'
       * - All Date objects wrapped with toISOStringSafe()
       * - Null checks before toISOStringSafe()
       */
      final: string;
    };
  }
}
