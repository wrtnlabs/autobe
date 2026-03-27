export interface IAutoBeCommonCorrectCastingApplication {
  /** Rewrite code to fix severe syntax structure or type system errors. */
  rewrite(props: IAutoBeCommonCorrectCastingApplication.IProps): void;

  /** Reject when error is outside scope (handled by subsequent agents). */
  reject(): void;
}
export namespace IAutoBeCommonCorrectCastingApplication {
  export interface IProps {
    /** Analysis of the error pattern and chosen fix strategy. */
    think: string;

    /** Draft code with initial syntax/type fixes applied. */
    draft: string;

    /** Self-review pass that checks corrections and produces final code. */
    revise: IReviseProps;
  }

  export interface IReviseProps {
    /**
     * Review of correction patterns applied and confirmation all errors
     * resolved.
     */
    review: string;

    /** Final corrected code, or `null` when draft already resolves all issues. */
    final: string | null;
  }
}
