export interface IAutoBeRealizeCorrectApplication {
  /**
   * Systematically analyze and correct TypeScript compilation errors.
   *
   * Implements a three-phase workflow (think → draft → revise) that balances
   * efficiency for simple errors with thoroughness for complex problems.
   *
   * Common error patterns handled:
   *
   * - TS2353: Non-existent fields in Prisma operations
   * - TS2339: Missing properties on types
   * - TS2322: Type assignment mismatches
   * - TS2345: String to literal union conversions
   *
   * @param props - Three-phase correction properties
   */
  review: (props: IAutoBeRealizeCorrectApplication.IProps) => void;
}

export namespace IAutoBeRealizeCorrectApplication {
  /**
   * Properties for the three-phase error correction workflow.
   *
   * This interface implements a progressive correction approach that
   * efficiently handles both simple and complex TypeScript compilation errors.
   * The three-phase structure allows for quick resolution of obvious issues
   * while providing comprehensive analysis for complex problems.
   *
   * **Workflow Philosophy:**
   *
   * - **think**: Rapid error assessment and strategy selection
   * - **draft**: Immediate application of obvious fixes
   * - **revise**: Systematic Chain of Thinking for complex cases
   *
   * **Efficiency Optimization:**
   *
   * - Simple errors (null handling, missing fields): Use minimal phases
   * - Complex errors (schema mismatches, interconnected issues): Use full
   *   analysis
   * - The revise object contains optional fields that can be skipped for trivial
   *   fixes
   *
   * This approach prevents over-engineering simple fixes while ensuring
   * thorough analysis for complex problems that could introduce new errors if
   * handled incorrectly.
   */
  export interface IProps {
    /**
     * Initial Error Analysis and Correction Strategy Selection.
     *
     * Quick assessment of the TypeScript compilation errors to determine the
     * appropriate correction approach and identify error patterns. This phase
     * decides whether to use minimal intervention or comprehensive analysis.
     *
     * **Analysis Elements:**
     *
     * 1. **Error Classification**:
     *
     *    - Simple errors: Obvious fixes like null handling, missing field removal
     *    - Complex errors: Interconnected issues, schema-API contradictions
     *    - Error count and relationships between multiple errors
     * 2. **Pattern Recognition**:
     *
     *    - Identify common error codes (TS2353, TS2339, TS2322, etc.)
     *    - Recognize recurring patterns (deleted_at fields, null/undefined
     *         confusion)
     *    - Detect schema-related issues vs type conversion problems
     * 3. **Strategy Selection**:
     *
     *    - Choose minimal fix approach for straightforward issues
     *    - Plan comprehensive analysis for complex or unclear errors
     *    - Determine which revise steps will be needed
     * 4. **Risk Assessment**:
     *
     *    - Identify potential cascade effects of fixes
     *    - Note areas where business logic might be affected
     *    - Flag unrecoverable errors (missing schema features)
     *
     * **Example Analysis:**
     *
     *     Error Analysis:
     *     - TS2353: 'deleted_at' field doesn't exist (common pattern)
     *     - TS2322: Date to string conversion needed
     *     Strategy: Simple fixes - remove deleted_at, add toISOStringSafe()
     *     Complexity: Low - can skip to final implementation
     */
    think: string;

    /**
     * Draft Implementation with Initial Corrections Applied.
     *
     * The working version of the code after applying the first round of obvious
     * fixes based on the error analysis. This represents the immediate,
     * actionable corrections that can be applied without deep analysis.
     *
     * **Draft Correction Categories:**
     *
     * 1. **Field Removal/Correction**:
     *
     *    - Remove references to non-existent schema fields
     *    - Fix obvious field name typos using TypeScript suggestions
     *    - Adjust WHERE clause conditions to use valid fields
     * 2. **Type Conversion Fixes**:
     *
     *    - Add null handling with ?? operators for safe defaults
     *    - Apply toISOStringSafe() for Date to string conversions
     *    - Convert null to undefined for optional API fields
     * 3. **Query Structure Adjustments**:
     *
     *    - Remove invalid Prisma operation parameters
     *    - Fix orderBy structures with proper type assertions
     *    - Adjust include/select clauses for proper data fetching
     * 4. **Function Signature Corrections**:
     *
     *    - Fix parameter types and argument mismatches
     *    - Correct return type compatibility issues
     *    - Add missing required properties
     *
     * **Draft Quality Expectations:**
     *
     * - Should resolve 70-90% of simple compilation errors
     * - May not be fully compilable if complex issues remain
     * - Serves as foundation for systematic revision in complex cases
     * - Preserves all business logic while fixing obvious type issues
     *
     * **Example Draft Content:**
     *
     * ```typescript
     * // Fixed: Removed deleted_at field, added date conversion
     * const updated = await MyGlobal.prisma.users.update({
     *   where: { id: props.params.id },
     *   data: {
     *     name: props.body.name,
     *     updated_at: toISOStringSafe(new Date()),
     *     // Removed: deleted_at (field doesn't exist)
     *   },
     * });
     * ```
     */
    draft: string;

    /**
     * Systematic Revision Process for Complex Error Correction.
     *
     * Comprehensive Chain of Thinking workflow that provides systematic
     * analysis and correction for complex compilation errors. This object
     * contains multiple optional phases that can be selectively used based on
     * error complexity.
     *
     * **When to Use Full Revision:**
     *
     * - Multiple interconnected errors across different code sections
     * - Schema-API contradictions requiring careful analysis
     * - Complex type mismatches that affect business logic
     * - Unclear error patterns that need systematic investigation
     *
     * **When to Skip Revision Steps:**
     *
     * - Simple field removal or null handling fixes
     * - Obvious type conversions (Date to string)
     * - Basic field name corrections
     * - Straightforward validation errors
     *
     * **Progressive Correction Approach:** The revision phases build upon each
     * other to ensure comprehensive error resolution while maintaining code
     * quality and business logic integrity. Each phase can be skipped if the
     * error correction is straightforward enough that additional analysis would
     * not provide value.
     */
    revise: IRevise;
  }

  /**
   * Systematic revision phases for complex error correction.
   *
   * This interface provides a comprehensive Chain of Thinking approach for
   * resolving complex TypeScript compilation errors. All fields except 'final'
   * are optional and should be used selectively based on error complexity.
   */
  export interface IRevise {
    /**
     * Step 1: Comprehensive TypeScript Error Analysis (OPTIONAL - Skip for
     * Simple Errors)
     *
     * Detailed analysis of TypeScript compiler diagnostics to understand error
     * patterns, root causes, and optimal resolution strategies. This phase
     * provides the foundation for systematic error correction.
     *
     * **Diagnostic Analysis Elements:**
     *
     * 1. **Error Code Breakdown**:
     *
     *    - Catalog all TypeScript error codes encountered (TS2353, TS2339, TS2322,
     *         etc.)
     *    - Map error codes to specific file locations and problematic code sections
     *    - Identify error frequency and patterns across the codebase
     * 2. **Root Cause Investigation**:
     *
     *    - Schema-field mismatches (non-existent fields in database)
     *    - Type incompatibilities (Date vs string, null vs undefined)
     *    - Relationship handling errors (missing includes, wrong join conditions)
     *    - API-database type mapping issues
     * 3. **Error Relationship Mapping**:
     *
     *    - Identify cascading errors (one root cause creating multiple symptoms)
     *    - Detect independent errors that can be fixed separately
     *    - Prioritize error resolution order to prevent fix conflicts
     * 4. **Resolution Strategy Planning**:
     *
     *    - Field removal strategy for non-existent schema fields
     *    - Type conversion approach for compatible type mismatches
     *    - Query restructuring plan for complex relationship errors
     *    - Alternative implementation approaches for unrecoverable errors
     *
     * **Common Error Patterns to Document:**
     *
     * - `deleted_at` field usage when soft delete isn't implemented
     * - Incorrect user field references (`guest_user_id` vs `user_id`)
     * - Date handling without proper string conversion
     * - Prisma relationship queries without proper includes
     * - Optional vs nullable field confusion in API responses
     *
     * **Example Analysis:**
     *
     *     Error Breakdown:
     *     1. TS2353 (3 occurrences): 'deleted_at' doesn't exist in User model
     *        - Root cause: Schema lacks soft delete implementation
     *        - Solution: Remove all deleted_at references, use hard delete
     *
     *     2. TS2322 (2 occurrences): Date not assignable to string
     *        - Root cause: Direct Date assignment to API string fields
     *        - Solution: Use toISOStringSafe() for all date conversions
     *
     *     Resolution Priority:
     *     1. Remove schema mismatches first (deleted_at)
     *     2. Fix type conversions second (Date to string)
     *     3. Validate final business logic
     */
    errorAnalysis?: string;

    /**
     * Step 2: Implementation Strategy and Architecture Plan (OPTIONAL - Skip
     * for Obvious Fixes)
     *
     * Strategic planning for the corrected implementation following the same
     * SCHEMA-FIRST APPROACH as the original Realize Write agent. This phase
     * re-establishes the foundation for correct implementation.
     *
     * **Planning Components:**
     *
     * 1. **Schema Re-verification**:
     *
     *    - Re-examine Prisma schema for actual available fields
     *    - Document field types, nullability, and relationships
     *    - Identify any assumptions that were incorrect in original code
     * 2. **Corrected Field Usage Strategy**:
     *
     *    - Plan which actual schema fields will be used
     *    - Design alternative approaches for missing expected fields
     *    - Plan relationship handling with verified schema structure
     * 3. **Type Compatibility Planning**:
     *
     *    - Map corrected database types to API response types
     *    - Plan null/undefined handling based on actual field nullability
     *    - Design proper type conversions (Date, branded types)
     * 4. **Business Logic Adaptation**:
     *
     *    - Adjust business logic to work with available schema features
     *    - Plan alternative implementations for unsupported operations
     *    - Ensure API contract compliance despite schema limitations
     *
     * **Example Planning:**
     *
     *     Corrected Implementation Plan:
     *     1. User deletion: Change from soft delete to hard delete
     *     2. User fields: Use 'user_id' instead of 'guest_user_id'
     *     3. Date handling: All DateTime fields converted with toISOStringSafe()
     *     4. Permissions: Verify ownership using auth.user.id
     */
    plan?: string;

    /**
     * Step 3: Verified Prisma Schema Definitions (OPTIONAL - Skip if Schema
     * Context Clear)
     *
     * Authoritative Prisma schema content for all models involved in the
     * corrected implementation. This serves as the definitive reference to
     * prevent further schema-related errors.
     *
     * **Schema Documentation Requirements:**
     *
     * - Complete model definitions with exact field names and types
     * - Relationship definitions with foreign key constraints
     * - Index and constraint information affecting queries
     * - Comments explaining any non-obvious field purposes
     *
     * **Verification Checklist:**
     *
     * - All referenced fields actually exist in the schema
     * - Field types match planned usage (String vs String?, DateTime, etc.)
     * - Relationships are correctly defined and accessible
     * - No assumptions about fields that don't exist
     *
     * This schema context prevents regression errors and ensures the corrected
     * implementation is built on verified foundations.
     */
    prismaSchemas?: string;

    /**
     * Step 4: Implementation Review and Validation (OPTIONAL - Skip for Simple
     * Corrections)
     *
     * Comprehensive review of the corrected implementation to ensure all errors
     * are resolved and no new issues are introduced. This phase validates the
     * complete solution before final implementation.
     *
     * **Review Validation Areas:**
     *
     * 1. **Compilation Verification**:
     *
     *    - Confirm all TypeScript errors are resolved
     *    - Verify no new errors are introduced by corrections
     *    - Check type safety is maintained throughout
     * 2. **Business Logic Integrity**:
     *
     *    - Ensure API contract is still fulfilled completely
     *    - Verify all required functionality is preserved
     *    - Check that corrections don't break intended behavior
     * 3. **Database Compatibility**:
     *
     *    - Confirm PostgreSQL and SQLite compatibility
     *    - Verify query efficiency and correctness
     *    - Check proper transaction handling if needed
     * 4. **Error Handling Completeness**:
     *
     *    - Validate HttpException usage with numeric status codes
     *    - Ensure proper error messages and user feedback
     *    - Check edge case handling and validation
     * 5. **Type Safety Validation**:
     *
     *    - Confirm null/undefined handling matches API interfaces
     *    - Verify Date conversions are correct and safe
     *    - Check branded type compatibility
     *
     * **Example Review:**
     *
     *     Correction Review:
     *     ✓ Removed all deleted_at references - compilation clean
     *     ✓ Added toISOStringSafe() for all date responses
     *     ✓ Changed soft delete to hard delete - API contract maintained
     *     ✓ Error handling: 404 for not found, 403 for unauthorized
     *     ✓ Type safety: All responses match interface definitions
     */
    review?: string;

    /**
     * Step 5: Final Corrected Implementation (REQUIRED - Always Present)
     *
     * Complete, production-ready TypeScript function implementation with all
     * compilation errors resolved and full type safety maintained. This code
     * must compile successfully and preserve all original business logic.
     *
     * **Final Implementation Standards:**
     *
     * CRITICAL - Compilation Requirements:
     *
     * - Zero TypeScript compilation errors
     * - No `any` types or unsafe type assertions
     * - Strict null checking compliance
     * - Complete type coverage for all operations
     *
     * CRITICAL - Code Structure:
     *
     * - Start with `export async function` (NO import statements)
     * - Follow exact function signature from API specification
     * - Include updated JSDoc documentation reflecting corrections
     * - Maintain NestJS provider function conventions
     *
     * CRITICAL - Error Resolution:
     *
     * - All original TypeScript errors completely resolved
     * - No new compilation errors introduced
     * - Proper handling of schema field limitations
     * - Safe fallbacks for unimplementable features
     *
     * CRITICAL - Business Logic Preservation:
     *
     * - API contract fully maintained
     * - All required functionality preserved
     * - Authentication and authorization intact
     * - Response format exactly matching interface
     *
     * CRITICAL - Database Operations:
     *
     * - All Prisma parameters inline (no intermediate variables)
     * - PostgreSQL and SQLite compatibility maintained
     * - Proper error handling with HttpException
     * - Safe Date conversions with toISOStringSafe()
     *
     * **Quality Validation:**
     *
     * - Code is immediately deployable without modifications
     * - All edge cases properly handled
     * - Performance considerations maintained
     * - Security best practices followed
     */
    final: string;
  }
}
