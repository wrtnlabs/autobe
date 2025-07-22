import { AutoBeOpenApi } from "@autobe/interface";

import { FAILED } from "./IAutoBeRealizeFailedSymbol";

export interface IAutoBeRealizeCoderApplication {
  programming: (input: IAutoBeRealizeCoderApplication.IProps) => void;
}

export namespace IAutoBeRealizeCoderApplication {
  /**
   * Properties for the component or function that consumes the output of the
   * code generation pipeline.
   */
  export interface IProps {
    /**
     * The detailed output of the code generation process, containing all phases
     * from planning to final implementation of a TypeScript provider function.
     */
    output: RealizeCoderOutput;
  }

  /**
   * Represents the complete output of a code generation pipeline. Each field
   * corresponds to a stage in the Chain of Thought (CoT) process for generating
   * a production-quality TypeScript function.
   *
   * All fields contain TypeScript code strings and follow these rules:
   *
   * - All code must be valid TypeScript or structurally valid even if incomplete.
   * - Each phase builds upon the previous one and must resolve specific concerns.
   * - All phases must follow system conventions around structure, typing, and
   *   logic.
   */
  export interface RealizeCoderOutput {
    /** @ignore */
    filename: string;

    /**
     * Step 1.
     *
     * 🧠 Provider Function Implementation Plan
     *
     * This field outlines the strategic plan for implementing the provider
     * function according to the Realize Coder Agent specification. Before
     * writing the actual code, think through the logic and structure.
     *
     * The plan must consider:
     *
     * - 🧩 Required business entities (e.g., users, posts, logs) and their
     *   relationships
     * - 🛠 Operations needed to fulfill the business scenario (e.g., fetch,
     *   create, update)
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
     *   to ISO strings with `.toISOString()` and brand as `string &
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
     * This is the initial drafting phase where you outline the basic skeleton
     * of the function.
     *
     * - The function signature must correctly include `user`, `parameters`, and
     *   `body` arguments.
     * - Design the main flow of business logic, such as DB fetches and early
     *   returns based on conditions.
     * - Mark any incomplete or missing parts clearly with placeholders (e.g.,
     *   comments or temporary values).
     *
     * ⚠️ Import rules:
     *
     * - Do NOT add any new import statements manually.
     * - All necessary imports are provided globally or by the system
     *   automatically.
     * - Writing import statements directly is prohibited and may cause compile
     *   errors. If import errors occur, check your environment configuration.
     *
     * ✅ Requirements:
     *
     * - Avoid using the `any` type at all costs to ensure type safety.
     * - Do NOT assign native `Date` objects directly; always convert dates using
     *   `.toISOString()` before assignment and apply proper branding.
     * - Maintain a single-function structure; avoid using classes.
     */
    draft: string;

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
     * - Include `.toISOString()` for all date fields.
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
     */
    withCompilerFeedback?: string;

    /**
     * Step 5.
     *
     * The complete and fully correct TypeScript function implementation.
     *
     * - Passes strict type checking without errors.
     * - Uses only safe branding or literal type assertions.
     * - Converts all date values properly to ISO string format.
     * - Follows DTO structures using `satisfies`.
     * - Avoids any weak typing such as `any`, `as any`, or `satisfies any`.
     * - Uses only allowed imports (e.g., from `src/api/structures` and
     *   `MyGlobal.prisma`).
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
     * - Do NOT assign native `Date` objects directly; always convert them to ISO
     *   strings with `.toISOString()`.
     * - Do NOT use unsafe type assertions except for safe branding or literal
     *   narrowing.
     * - Do NOT write code outside the single async function structure (e.g., no
     *   classes or multiple functions).
     * - Do NOT perform any input validation — assume all inputs are already
     *   validated.
     * - Do NOT use dynamic import expressions (`import()`); all imports must be
     *   static.
     * - Do NOT rely on DTO types for database update input; always use
     *   Prisma-generated input types.
     * - Do NOT escape newlines or quotes in the implementation string (e.g., no
     *   `\\n` or `\"`); use a properly formatted template literal with actual
     *   line breaks instead.
     */
    implementationCode: string;
  }

  export interface IPipeOutput {
    result: RealizeCoderOutput | FAILED;

    operation: AutoBeOpenApi.IOperation;
  }
}
