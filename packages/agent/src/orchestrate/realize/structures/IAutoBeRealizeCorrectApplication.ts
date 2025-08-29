import { IAutoBeRealizeWriteApplication } from "./IAutoBeRealizeWriteApplication";

export interface IAutoBeRealizeCorrectApplication {
  /**
   * Reviews and corrects TypeScript compilation errors with minimal changes.
   *
   * This method acts as the Error Correction Specialist, fixing TypeScript
   * compilation errors while preserving original business logic. It applies
   * the principle of minimal intervention - only changing what's necessary
   * to resolve compilation issues.
   *
   * The correction strategy prioritizes:
   * - **Minimal changes**: Fix only what causes errors, preserve everything else
   * - **Schema as truth**: If fields don't exist in schema, remove them entirely
   * - **Type safety**: Apply proper conversions without using `as any`
   * - **Unrecoverable errors**: Document contradictions and use typia.random when impossible
   *
   * Common fixes include removing non-existent fields (like deleted_at),
   * converting types properly, and resolving Prisma query structure issues.
   * When schema-API contradictions make implementation impossible, it documents
   * the issue and returns mock data.
   *
   * @param props Properties containing error analysis and the corrected multi-phase implementation
   */
  review: (props: IAutoBeRealizeCorrectApplication.IProps) => void;
}

export namespace IAutoBeRealizeCorrectApplication {
  export interface IProps extends IAutoBeRealizeWriteApplication.IProps {
    /**
     * Compilation Error Analysis and Resolution Strategy
     *
     * This field contains a detailed analysis of TypeScript compilation errors
     * that occurred during the previous compilation attempt, along with
     * specific strategies to resolve each error.
     *
     * The analysis MUST include:
     *
     * 📊 ERROR BREAKDOWN:
     *
     * - List of all TypeScript error codes encountered (e.g., TS2339, TS2345)
     * - Exact error messages and the lines/files where they occurred
     * - Categorization of errors by type (type mismatch, missing property, etc.)
     *
     * 🔍 ROOT CAUSE ANALYSIS:
     *
     * - Why each error occurred (e.g., incorrect type assumptions, missing
     *   fields)
     * - Relationship between errors (e.g., cascading errors from a single issue)
     * - Common patterns identified across multiple errors
     *
     * 🛠 RESOLUTION STRATEGY:
     *
     * - Specific fixes for each error type
     * - Priority order for addressing errors (fix critical errors first)
     * - Alternative approaches if the direct fix is not possible
     *
     * 📝 SCHEMA VERIFICATION:
     *
     * - Re-verification of Prisma schema fields actually available
     * - Identification of assumed fields that don't exist
     * - Correct field types and relationships
     *
     * ⚠️ COMMON ERROR PATTERNS TO CHECK:
     *
     * - Using non-existent fields (e.g., deleted_at, created_by)
     * - Type mismatches in Prisma operations
     * - Incorrect date handling (using Date instead of string)
     * - Missing required fields in create/update operations
     * - Incorrect relation handling in nested operations
     *
     * 🎯 CORRECTION APPROACH:
     *
     * - Remove references to non-existent fields
     * - Fix type conversions (especially dates with toISOStringSafe())
     * - Simplify complex nested operations into separate queries
     * - Add missing required fields
     * - Use correct Prisma input types
     *
     * Example structure:
     *
     *     Errors Found:
     *     1. TS2339: Property 'deleted_at' does not exist on type 'User'
     *        - Cause: Field assumed but not in schema
     *        - Fix: Remove all deleted_at references
     *
     *     2. TS2345: Type 'Date' is not assignable to type 'string'
     *        - Cause: Direct Date assignment without conversion
     *        - Fix: Use toISOStringSafe() for all date values
     *
     *     Resolution Plan:
     *     1. First, remove all non-existent field references
     *     2. Then, fix all date type conversions
     *     3. Finally, adjust Prisma query structures
     *
     * This analysis ensures the review process addresses all compilation errors
     * systematically and produces error-free code in the corrected
     * implementation.
     */
    errorAnalysis: string;
  }
}
