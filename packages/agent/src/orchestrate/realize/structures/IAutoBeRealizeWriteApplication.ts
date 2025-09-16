export interface IAutoBeRealizeWriteApplication {
  /**
   * Generates provider function implementation through multi-phase development.
   *
   * This method implements a systematic approach to generate NestJS provider
   * functions that handle business logic for API operations. It follows a
   * schema-first approach with multiple refinement phases to ensure type-safe,
   * error-free code generation.
   *
   * The generation process includes:
   *
   * 1. Strategic planning based on Prisma schema analysis
   * 2. Schema definition for relevant models
   * 3. Review and refinement for completeness
   * 4. Final implementation with all validations and type safety
   *
   * @param next Properties containing the multi-phase implementation plan and
   *   code
   */
  coding: (next: IAutoBeRealizeWriteApplication.IProps) => void;
}

export namespace IAutoBeRealizeWriteApplication {
  /**
   * Properties for the Realize Write Application following Chain of Thinking
   * (CoT).
   *
   * Each field represents a distinct phase in the implementation process.
   * Detailed guidelines are in REALIZE_WRITE.md.
   */
  export interface IProps {
    /**
     * Step 1 - Planning Phase (CoT: Initial Reasoning)
     *
     * Strategic plan following SCHEMA-FIRST APPROACH:
     *
     * 1. Verify Prisma schema fields (list existing and non-existing)
     * 2. Plan field usage in operations
     * 3. Plan type conversions and nullable handling
     * 4. Define implementation approach with error handling
     *
     * See REALIZE_WRITE.md for detailed requirements.
     */
    plan: string;

    /** Step 2 - Relevant Prisma schema models and fields */
    prismaSchemas: string;

    /** Step 3 - Refined version with real operations */
    review: string;

    /** Step 4 - Final implementation See REALIZE_WRITE.md for requirements */
    final: string;
  }
}
