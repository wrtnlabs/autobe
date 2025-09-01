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
   * 1. Strategic planning based on Prisma schema analysis
   * 2. Initial draft without Date type usage
   * 3. Review and refinement for completeness
   * 4. Compiler feedback integration if errors detected
   * 5. Final implementation with all validations and type safety
   *
   * @param next Properties containing the multi-phase implementation plan and code
   */
  coding: (next: IAutoBeRealizeWriteApplication.IProps) => void;
}

export namespace IAutoBeRealizeWriteApplication {
  export interface IProps {
    /**
     * Step 1.
     *
     * 🧠 Provider Function Implementation Plan
     *
     * This field outlines the strategic plan for implementing the provider
     * function according to the Realize Coder Agent specification. Before
     * writing the actual code, think through the logic and structure.
     *
     * The plan follows a SCHEMA-FIRST APPROACH:
     *
     * 📋 STEP 1 - PRISMA SCHEMA VERIFICATION:
     *
     * DO:
     *
     * - Examine the actual Prisma schema model definition
     * - List EVERY field that exists in the model with exact types
     * - Explicitly note fields that DO NOT exist
     *
     * DO NOT:
     *
     * - Assume common fields exist without verification
     * - Use fields like deleted_at, created_by, updated_by, is_deleted, is_active
     *   without checking
     *
     * 📋 STEP 2 - FIELD INVENTORY:
     *
     * - List ONLY fields confirmed to exist in schema
     * - Example: "Verified fields in user model: id (String), email (String),
     *   created_at (DateTime), updated_at (DateTime)"
     * - Example: "Fields that DO NOT exist: deleted_at, is_active, created_by"
     *
     * 📋 STEP 3 - FIELD ACCESS STRATEGY:
     *
     * - Plan which verified fields will be used in select, update, create
     *   operations
     * - For complex operations with type errors, plan to use separate queries
     *   instead of nested operations
     *
     * 📋 STEP 4 - TYPE COMPATIBILITY:
     *
     * - Plan DateTime to ISO string conversions using toISOStringSafe()
     * - Plan handling of nullable vs required fields
     *
     * 📋 STEP 5 - IMPLEMENTATION APPROACH:
     *
     * - 🧩 Required business entities (e.g., users, posts, logs) and their
     *   relationships
     * - 🛠 Operations needed to fulfill the business scenario (e.g., fetch,
     *   create, update) using ONLY verified fields
     * - 🔄 Data dependencies between steps (e.g., use userId to fetch related
     *   data)
     * - ✅ Validation points (based on business rules, not field presence)
     * - 🚧 Error and edge cases that must be handled explicitly (e.g., missing
     *   records)
     * - 🏗 Structure: always a single `async function`, using only `parameters`
     *   and `body`
     *
     * ⚠️ Important Constraints:
     *
     * - Do NOT perform input validation — assume `parameters` and `body` are
     *   already valid
     * - Use `typia.random<T>()` with an explanatory comment if logic can't be
     *   implemented
     * - Never use `any` or make assumptions without sufficient context
     * - Use only allowed imports — DTOs and Prisma types
     * - Use `MyGlobal.prisma` for DB access and respect Prisma typing rules
     *
     * ⚠️ TypeScript-specific considerations:
     *
     * - Do **not** use native `Date` objects directly; always convert all dates
     *   using `toISOStringSafe()` and brand as `string &
     *   tags.Format<'date-time'>`. This rule applies throughout all phases.
     * - Prefer `satisfies` for DTO conformance instead of unsafe `as` casts
     * - Avoid weak typing such as `any`, `as any`, or `satisfies any`
     * - Use branded types (e.g., `tags.Format<'uuid'>`) and literal unions where
     *   applicable
     *
     * ✅ Example Structure:
     *
     * ```ts
     * export async function doSomething(
     *   user: { id: string & tags.Format<"uuid">; type: string },
     *   parameters: IParams,
     *   body: IBody
     * ): Promise<IReturn> {
     *   const { id } = parameters;
     *   const { name } = body;
     *   const user = await MyGlobal.prisma.users.findFirst({ where: { id } });
     *   if (!user) throw new Error("User not found");
     *   ...
     *   return result;
     * }
     * ```
     *
     * 🔍 Feasibility Analysis Requirement:
     *
     * - Before generating any code, the agent **must analyze** whether the
     *   requested implementation is **feasible based on the given Prisma schema
     *   and DTO types**.
     * - If required fields or relationships are **missing or incompatible**, the
     *   plan should explicitly state that the implementation is **not
     *   possible** with the current schema/DTO, and no code should be generated
     *   in later stages.
     * - In such cases, only a detailed **comment in the `implementationCode`**
     *   should be returned explaining why the logic cannot be implemented.
     *
     * 🔥 Error Handling Plan:
     *
     * If an error is expected or encountered during implementation:
     *
     * - Clearly document the error message(s) and TypeScript error codes.
     * - Analyze the root cause (e.g., type mismatch, missing field, nullability
     *   issue).
     * - Define concrete steps to resolve the issue, such as:
     *
     *   - Adjusting type declarations or using Prisma-generated input types.
     *   - Using `?? undefined` to normalize nullable fields.
     *   - Applying correct relation handling (e.g., `connect` instead of direct
     *       foreign key assignment).
     *   - Ensuring all date fields use `.toISOString()` and proper branding.
     * - Include fallback or workaround plans if a direct fix is complex.
     * - If no error is present, simply omit this section.
     *
     * This plan ensures the function will:
     *
     * - Respect the global architecture and coding conventions
     * - Be safe, predictable, and aligned with upstream logic
     */
    plan: string;

    /**
     * Step 2.
     *
     * The Prisma schema string that will be used to validate the implementation
     * logic in this file.
     *
     * You must **explicitly specify only the relevant models and fields** from
     * your full schema that are used in this implementation. This ensures that
     * your logic is aligned with the expected database structure without
     * accidentally introducing unrelated fields or models.
     *
     * ⚠️ Important: The value of this field must be a valid Prisma schema
     * string containing only the models used in this code — not the entire
     * schema.
     *
     * This acts as a safeguard against:
     *
     * - Forgetting required fields used in this implementation
     * - Including fields or models that are not actually used
     */
    prisma_schemas: string;

    /**
     * Step 3.
     *
     * Draft WITHOUT using native Date type.
     *
     * This is the initial drafting phase where you outline the basic skeleton
     * of the function.
     *
     * DO NOT: Use the native Date type.
     *
     * - The function signature must correctly include `user`, `parameters`, and
     *   `body` arguments.
     * - Design the main flow of business logic, such as DB fetches and early
     *   returns based on conditions.
     * - Mark any incomplete or missing parts clearly with placeholders (e.g.,
     *   comments or temporary values).
     *
     * Import rules:
     *
     * DO NOT:
     *
     * - Add any new import statements manually
     * - Write import statements directly (this causes compile errors)
     *
     * Note: All necessary imports are provided globally or by the system
     * automatically.
     *
     * ✅ Requirements:
     *
     * - Avoid using the `any` type at all costs to ensure type safety.
     * - NEVER declare variables with `: Date` type
     * - ALWAYS use `string & tags.Format<'date-time'>` for date values
     * - Use `toISOStringSafe(new Date())` for current timestamps
     * - Maintain a single-function structure; avoid using classes.
     */
    draft_without_date_type: string;

    /**
     * Step 4.
     *
     * A refined version of the draft with improved completeness.
     *
     * - Replace placeholder logic with real DTO-conformant operations.
     * - Add error handling (`throw new Error(...)`) where necessary.
     * - Begin resolving structural or type mismatches.
     *
     * ✅ Requirements:
     *
     * - Use `satisfies` to ensure DTO conformity.
     * - Avoid unsafe `as` casts unless only for branding or literal narrowing.
     * - Use `toISOStringSafe()` for all date conversions (NOT `.toISOString()`).
     * - Ensure all object keys strictly conform to the expected type definitions.
     */
    review: string;

    /**
     * 🛠 Phase 4-2: With compiler feedback (optional)
     *
     * A correction pass that applies fixes for compile-time errors that arose
     * during the review stage (if any).
     *
     * ✅ Must:
     *
     * - Only include this field if TypeScript errors are detected in the Review
     *   phase.
     * - Resolve all TypeScript errors without using `as any`.
     * - Provide safe brand casting only if required (e.g., `as string &
     *   tags.Format<'uuid'>`).
     * - If no TypeScript errors exist, this field MUST contain the text: "No
     *   TypeScript errors detected - skipping this phase"
     */
    withCompilerFeedback: string;

    /**
     * Step 5.
     *
     * The complete and fully correct TypeScript function implementation.
     *
     * - Passes strict type checking without errors.
     * - Uses only safe branding or literal type assertions.
     * - Converts all date values properly using `toISOStringSafe()`.
     * - Follows DTO structures using `satisfies`.
     * - Avoids any weak typing such as `any`, `as any`, or `satisfies any`.
     * - Uses only allowed imports (e.g., from `../api/structures` and
     *   `MyGlobal.prisma`).
     * - NEVER creates intermediate variables for Prisma operations.
     *
     * ⚠️ Fallback Behavior:
     *
     * - If the `plan` phase explicitly determines that the requested logic is
     *   **not feasible** due to mismatches or limitations in the provided
     *   Prisma schema and DTO types:
     *
     *   - The implementation must still return a syntactically valid function.
     *   - In such cases, return mock data using `typia.random<T>()` wrapped in the
     *       correct structure, along with a comment explaining the limitation.
     *
     *   Example fallback:
     *
     * ```ts
     *   // ⚠️ Cannot implement logic due to missing relation between A and B
     *   export async function someFunction(...) {
     *     return typia.random<IReturn>(); // mocked output
     *   }
     * ```
     *
     * ⚠️ Prohibited Practices:
     *
     * - Do NOT add or modify import statements manually. Imports are handled
     *   automatically by the system.
     * - Do NOT use `any`, `as any`, or `satisfies any` to bypass type checking.
     * - Do NOT assign native `Date` objects directly; always convert them using
     *   `toISOStringSafe()`.
     * - Do NOT use unsafe type assertions except for safe branding or literal
     *   narrowing.
     * - Do NOT write code outside the single async function structure (e.g., no
     *   classes or multiple functions).
     * - Do NOT perform any input validation — assume all inputs are already
     *   validated.
     * - Do NOT use dynamic import expressions (`import()`); all imports must be
     *   static.
     * - Do NOT use Prisma-generated input types; always use types from
     *   `../api/structures`.
     * - Do NOT use `Object.prototype.hasOwnProperty.call()` for field checks.
     * - Do NOT escape newlines or quotes in the implementation string (e.g., no
     *   `\\n` or `\"`); use a properly formatted template literal with actual
     *   line breaks instead.
     */
    implementationCode: string;
  }
}
