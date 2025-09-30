export interface IAutoBeRealizeWriteApplication {
  /**
   * Generate complete provider function implementation using Chain of Thinking.
   *
   * Follows a 4-phase process: plan → prismaSchemas → review → final.
   * Ensures type safety, proper Prisma usage, and API contract compliance.
   *
   * @param next - Chain of Thinking properties for implementation
   */
  coding: (next: IAutoBeRealizeWriteApplication.IProps) => void;
}

export namespace IAutoBeRealizeWriteApplication {
  /**
   * Properties for the Chain of Thinking (CoT) implementation workflow.
   *
   * This interface defines the systematic 4-phase approach used by the Realize
   * Write agent to generate reliable, type-safe provider function
   * implementations. Each field represents a critical thinking phase that
   * builds upon the previous one, ensuring thorough analysis and robust code
   * generation.
   *
   * The Chain of Thinking approach prevents common implementation errors by:
   *
   * - Forcing explicit schema verification before coding
   * - Planning type conversions and null handling upfront
   * - Reviewing business logic before final implementation
   * - Producing self-documented, maintainable code
   *
   * All phases work together to ensure the final implementation is
   * production-ready and follows AutoBE's strict conventions for type safety
   * and database compatibility.
   */
  export interface IProps {
    /**
     * Step 1 - Strategic Implementation Planning (CoT: Initial Reasoning)
     *
     * Comprehensive analysis and planning phase that establishes the foundation
     * for the entire implementation. This phase follows the mandatory
     * SCHEMA-FIRST APPROACH to prevent runtime errors and type mismatches.
     *
     * **Critical Planning Elements:**
     *
     * 1. **Prisma Schema Verification**:
     *
     *    - List ALL available fields with exact types from the schema
     *    - Identify fields that do NOT exist (e.g., deleted_at, created_by)
     *    - Document relationship fields and their constraints
     *    - Verify field nullability (String vs String?)
     * 2. **Field Usage Strategy**:
     *
     *    - Plan which schema fields will be used in queries
     *    - Design data flow from request → database → response
     *    - Define filtering, sorting, and pagination approaches
     *    - Plan relationship handling (include/select strategies)
     * 3. **Type Conversion Planning**:
     *
     *    - Map API request types to Prisma input types
     *    - Plan Date to string conversions using toISOStringSafe()
     *    - Design null/undefined handling for optional vs nullable fields
     *    - Plan branded type handling (UUID, date-time formats)
     * 4. **Implementation Architecture**:
     *
     *    - Define business logic flow and validation steps
     *    - Plan error handling with specific HttpException cases
     *    - Design authentication and authorization checks
     *    - Outline edge cases and fallback strategies
     *
     * **Example Planning Content:**
     *
     *     Operation: Update user profile
     *     Schema Analysis:
     *     - users table has: id, email, name, updated_at (all non-nullable)
     *     - users table does NOT have: deleted_at, created_by
     *     Type Conversions:
     *     - API sends: email?: string | null → convert null to undefined for Prisma
     *     - Response needs: updated_at as string (use toISOStringSafe)
     *     Error Handling:
     *     - 404 if user not found
     *     - 403 if user tries to update another user's profile
     */
    plan: string;

    /**
     * Step 2 - Relevant Prisma Schema Context (CoT: Knowledge Base)
     *
     * Complete and accurate Prisma schema definitions for all models used in
     * the implementation. This serves as the authoritative source of truth for
     * field names, types, relationships, and constraints.
     *
     * **Schema Documentation Requirements:**
     *
     * - **Complete Model Definitions**: Include the full `model` block from
     *   schema.prisma
     * - **Exact Field Types**: Document precise types (String vs String?,
     *   DateTime vs DateTime?)
     * - **Relationship Definitions**: Include all @relation directives and
     *   foreign keys
     * - **Constraint Documentation**: Note unique indexes, default values, and
     *   validations
     * - **Multiple Models**: Include all related models that will be queried or
     *   joined
     *
     * **Critical for Implementation:**
     *
     * - Field existence verification (prevents "property does not exist" errors)
     * - Type compatibility checking (prevents assignment errors)
     * - Relationship planning (guides include/select strategies)
     * - Null handling decisions (based on nullable vs non-nullable fields)
     *
     * **Example Content:**
     *
     * ```prisma
     * model users {
     *   id         String   @id @default(uuid())
     *   email      String   @unique
     *   name       String
     *   profile_id String?
     *   created_at DateTime @default(now())
     *   updated_at DateTime @updatedAt
     *   profile    profiles? @relation(fields: [profile_id], references: [id])
     * }
     *
     * model profiles {
     *   id      String @id @default(uuid())
     *   bio     String?
     *   website String?
     *   users   users[]
     * }
     * ```
     *
     * **Schema Validation Checklist:**
     *
     * - Verify all field names match exactly (case-sensitive)
     * - Confirm field types support planned operations
     * - Check relationship directions and foreign key constraints
     * - Validate nullable fields align with API requirements
     */
    prismaSchemas: string;

    /**
     * Step 3 - Implementation Review and Refinement (CoT: Logic Validation)
     *
     * Detailed review of the planned implementation with concrete operations,
     * business logic validation, and edge case handling. This phase transforms
     * the strategic plan into specific, actionable implementation details.
     *
     * **Review Focus Areas:**
     *
     * 1. **Business Logic Validation**:
     *
     *    - Verify the implementation satisfies API requirements completely
     *    - Check that all input parameters are properly used and validated
     *    - Ensure return types match API specification exactly
     *    - Validate authentication and authorization logic
     * 2. **Database Operation Review**:
     *
     *    - Review Prisma query structures for efficiency and correctness
     *    - Validate include/select strategies for optimal data fetching
     *    - Check WHERE clause conditions and parameter binding
     *    - Ensure proper transaction handling for multi-step operations
     * 3. **Type Safety Analysis**:
     *
     *    - Verify null/undefined handling matches API interface patterns
     *    - Check Date conversion strategies using toISOStringSafe()
     *    - Validate branded type handling (UUID formats, etc.)
     *    - Ensure no intermediate variables for Prisma parameters
     * 4. **Error Handling Strategy**:
     *
     *    - Define specific HttpException cases with numeric status codes
     *    - Plan validation error messages and user feedback
     *    - Design fallback behaviors for edge cases
     *    - Ensure proper error propagation and logging
     * 5. **Performance Considerations**:
     *
     *    - Review query efficiency and potential N+1 problems
     *    - Validate pagination and sorting implementations
     *    - Check for unnecessary data fetching or transformations
     *    - Ensure database compatibility (PostgreSQL/SQLite)
     *
     * **Example Review Content:**
     *
     *     Implementation Review:
     *     1. User authentication check: verified using auth.user.id
     *     2. Profile update query: using inline data object, no variables
     *     3. Null handling: email field is optional, using undefined for null
     *     4. Error cases: 404 for not found, 403 for permission denied
     *     5. Response format: matches IUserProfileUpdate interface exactly
     *     6. Date handling: updated_at converted with toISOStringSafe()
     */
    review: string;

    /**
     * Step 4 - Complete Implementation (CoT: Final Solution)
     *
     * The final, production-ready TypeScript function implementation that
     * incorporates all planning, schema analysis, and review insights. This
     * code must be immediately compilable and follow all AutoBE conventions
     * without any modifications.
     *
     * **Implementation Requirements:**
     *
     * CRITICAL - Code Structure:
     *
     * - Start directly with `export async function` (NO import statements)
     * - Use exact function signature from API specification
     * - Include comprehensive JSDoc documentation with parameter descriptions
     * - Follow NestJS provider function patterns consistently
     *
     * CRITICAL - Type Safety:
     *
     * - Strict TypeScript compliance with no `any` types
     * - Proper null vs undefined handling based on API interface patterns
     * - Correct branded type usage (UUID, date-time formats)
     * - Type-safe Prisma operations with inline parameters only
     *
     * CRITICAL - Database Operations:
     *
     * - All Prisma parameters defined inline (NO intermediate variables)
     * - Compatible with both PostgreSQL and SQLite (no `mode: "insensitive"`)
     * - Proper relationship handling with include/select strategies
     * - Transaction usage for multi-step operations when needed
     *
     * CRITICAL - Error Handling:
     *
     * - Use `HttpException` with numeric status codes (never enum constants)
     * - Meaningful error messages for debugging and user feedback
     * - Proper validation of required fields and business rules
     * - Graceful handling of edge cases and invalid inputs
     *
     * CRITICAL - Data Transformation:
     *
     * - Date conversions using `toISOStringSafe()` for API responses
     * - Proper handling of optional vs nullable fields in responses
     * - Response format exactly matching API interface specifications
     * - Auth payload integration for user context and permissions
     *
     * The final implementation represents the culmination of the Chain of
     * Thinking process, incorporating all insights from planning, schema
     * analysis, and review phases to produce robust, maintainable,
     * production-ready code.
     */
    final: string;
  }
}
