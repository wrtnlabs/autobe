import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

/**
 * Function calling interface for generating DTO transformer functions.
 *
 * Guides the AI agent through creating reusable transformer modules that
 * convert Prisma database query results to API response DTOs (DB → API). Each
 * transformer includes type-safe conversion logic and Prisma select
 * specifications for efficient data loading.
 *
 * The generation follows a structured RAG workflow: preliminary context
 * gathering (Prisma schemas only) → implementation planning → code generation →
 * review and refinement. All necessary DTO type information is obtained
 * transitively from the DTO type names provided in the plan
 * (AutoBeRealizeTransformerPlan).
 *
 * The planning phase has already filtered out incompatible DTO types (e.g.,
 * IPage*, *.IRequest, *.ICreate, *.IUpdate), so the write phase only receives
 * DTOs that require transformers.
 */
export interface IAutoBeRealizeTransformerWriteApplication {
  /**
   * Process transformer generation task or preliminary data requests.
   *
   * Generates complete transformer module through three-phase workflow (plan →
   * draft → revise). Ensures type safety, proper Prisma payload types, and
   * correct DTO mapping.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeRealizeTransformerWriteApplication.IProps): void;
}

export namespace IAutoBeRealizeTransformerWriteApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests:
     *
     * - What Prisma schemas are missing that you need?
     * - Why do you need them for transformer generation?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For completion:
     *
     * - What schemas did you acquire?
     * - What transformer patterns did you implement?
     * - Why is it sufficient to complete?
     * - Summarize - don't enumerate every field mapping.
     *
     * Note: All necessary DTO type information is available transitively from
     * the DTO type names in the plan. You only need to request Prisma schemas.
     *
     * This reflection helps you avoid duplicate requests and premature
     * completion.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform:
     *
     * - "getPrismaSchemas": Retrieve Prisma table schemas for DB structure
     * - "complete": Generate final transformer implementation
     *
     * All necessary DTO type information is obtained transitively from the DTO
     * type names provided in the plan (AutoBeRealizeTransformerPlan). Each DTO
     * type name allows the system to recursively fetch all referenced types,
     * providing complete type information without requiring explicit schema
     * requests.
     *
     * The preliminary types are removed from the union after their respective
     * data has been provided, physically preventing repeated calls.
     */
    request: IComplete | IAutoBePreliminaryGetPrismaSchemas;
  }

  /**
   * Request to generate transformer module implementation.
   *
   * Executes three-phase generation to create complete transformer with:
   *
   * - Transform() function: Converts Prisma payload to DTO
   * - Select() function: Returns Prisma include/select specification
   *
   * Follows plan → draft → revise pattern to ensure type safety and correct
   * field mappings.
   *
   * Note: The Prisma schema name is provided as input from the planning phase,
   * so it doesn't need to be returned in the response.
   */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /**
     * Transformer implementation plan and strategy.
     *
     * MUST contain thorough analysis with these four mandatory sections:
     *
     * 1. Prisma Schema Field Inventory - List ALL fields with exact names from
     *    schema
     * 2. DTO Property Inventory - List ALL properties with types
     * 3. Field-by-Field Mapping Strategy - Explicit table for BOTH select() and
     *    transform()
     * 4. Edge Cases and Special Handling - Type casts (Decimal, DateTime),
     *    nullables
     *
     * This forces you to READ the actual schema (not imagine it) and creates an
     * explicit specification for both select() and transform() functions.
     */
    plan: string;

    /**
     * Initial transformer implementation draft.
     *
     * Complete implementation that strictly follows the plan's mapping table.
     * EVERY field in the plan's Section 3 MUST appear in BOTH select() and
     * transform(). Implement:
     *
     * - Transform() first, select() second, Payload last (correct order)
     * - All field mappings from plan with correct transformations
     * - Neighbor transformer reuse (NEVER inline when transformer exists)
     * - ALWAYS use `select`, NEVER use `include`
     */
    draft: string;

    /**
     * Revision and finalization phase.
     *
     * Reviews the draft implementation and produces the final code with all
     * improvements and corrections applied.
     */
    revise: IReviseProps;
  }

  export interface IReviseProps {
    /**
     * Critical review and improvement analysis.
     *
     * MUST systematically verify using four checklists:
     *
     * 1. Schema Fidelity - Cross-check EVERY field name against plan Section 1
     *    inventory
     * 2. Plan Adherence - Verify EVERY mapping from Section 3 in BOTH select() and
     *    transform()
     * 3. System Rules - Mandatory neighbor reuse, function order, select (not
     *    include)
     * 4. Type Safety - Type casts (Decimal→Number, DateTime→ISO), nullable
     *    handling
     *
     * Identify specific issues with line numbers and provide clear reasoning.
     * This catches hallucinated fields, missing transformations, and rule
     * violations.
     */
    review: string;

    /**
     * Final transformer code with all review improvements applied.
     *
     * Apply ALL fixes identified in the review to produce production-ready
     * code. If review found issues, this MUST contain the corrected
     * implementation.
     *
     * Return `null` ONLY if the draft is already perfect and review found zero
     * issues.
     */
    final: string | null;
  }
}
