export interface IAutoBeRealizeCorrectApplication {
  /**
   * Reviews and corrects TypeScript compilation errors.
   *
   * Fixes TypeScript compilation errors while preserving original business
   * logic, applying minimal intervention principle.
   *
   * @param props Properties containing the multi-phase error correction process
   */
  review: (props: IAutoBeRealizeCorrectApplication.IProps) => void;
}

export namespace IAutoBeRealizeCorrectApplication {
  /**
   * Properties for error correction following Chain of Thinking (CoT).
   *
   * All phases are wrapped in a `revise` object for systematic error
   * resolution.
   */
  export interface IProps {
    /** Revision process containing all error correction phases. */
    revise: IRevise;
  }

  export interface IRevise {
    /** Step 1: Compilation error analysis and resolution strategy. */
    errorAnalysis?: string;

    /** Step 2: Provider function implementation plan. */
    plan?: string;

    /** Step 3: Relevant Prisma schema definitions. */
    prismaSchemas?: string;

    /** Step 4: Initial draft without using native Date type. */
    draftWithoutDateType?: string;

    /** Step 5: Refined version with improved completeness. */
    review?: string;

    /** Step 6: Corrected implementation after compiler feedback. */
    withCompilerFeedback?: string;

    /** Step 7: Final complete TypeScript function implementation. */
    implementationCode: string;
  }
}
