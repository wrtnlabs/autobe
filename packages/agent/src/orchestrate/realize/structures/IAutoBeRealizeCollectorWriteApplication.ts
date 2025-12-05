import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

/**
 * Function calling interface for generating DTO collector functions.
 *
 * Guides the AI agent through creating reusable collector modules that prepare
 * Prisma input data from API request DTOs (API → DB). Each collector handles
 * complex nested relationships, UUID generation, and proper Prisma
 * connect/create syntax.
 *
 * The generation follows a structured RAG workflow: preliminary context
 * gathering (Prisma schemas only) → implementation planning → code generation →
 * review and refinement. All necessary DTO type information is obtained
 * transitively from the DTO type names provided in the plan
 * (AutoBeRealizeCollectorPlan).
 */
export interface IAutoBeRealizeCollectorWriteApplication {
  /**
   * Process collector generation task or preliminary data requests.
   *
   * Generates complete collector module through three-phase workflow (plan →
   * draft → revise). Ensures type safety, proper Prisma input types, and
   * correct relationship handling.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeRealizeCollectorWriteApplication.IProps): void;
}

export namespace IAutoBeRealizeCollectorWriteApplication {
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
     * - Why do you need them for collector generation?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For completion:
     *
     * - What schemas did you acquire?
     * - What collector patterns did you implement?
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
     * - "complete": Generate final collector implementation
     *
     * All necessary DTO type information is obtained transitively from the DTO
     * type names provided in the plan (AutoBeRealizeCollectorPlan). Each DTO
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
   * Request to generate collector module implementation.
   *
   * Executes three-phase generation to create complete collector with:
   *
   * - Collect() function: Converts DTO to Prisma input
   * - Proper handling of nested relationships
   * - UUID generation for new records
   * - Type-safe Prisma create/connect syntax
   *
   * Follows plan → draft → revise pattern to ensure type safety and correct
   * relationship handling.
   */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /**
     * Collector implementation plan and strategy.
     *
     * MUST contain thorough analysis with these four mandatory sections:
     *
     * 1. Prisma Schema Field Inventory - List ALL fields with exact names from
     *    schema
     * 2. DTO Property Inventory - List ALL properties with types
     * 3. Field-by-Field Mapping Strategy - Explicit mapping table for every field
     * 4. Edge Cases and Special Handling - Nullable, arrays, conditionals
     *
     * This forces you to READ the actual schema (not imagine it) and creates an
     * explicit specification that the draft must implement.
     */
    plan: string;

    /**
     * Field-by-field mapping table for complete Prisma coverage.
     *
     * MUST include EVERY field and relation from the Prisma schema - no
     * exceptions. Each mapping specifies how to obtain/generate the value for
     * that field. Missing even a single field will cause validation failure and
     * trigger regeneration.
     *
     * This structured approach:
     *
     * - Prevents field omissions through systematic coverage
     * - Forces explicit decision-making for each field
     * - Enables validation before code generation
     * - Creates clear documentation of field handling strategy
     *
     * The validator will cross-check this list against the actual Prisma schema
     * and reject incomplete mappings.
     */
    mappings: IMapping[];

    /**
     * Initial collector implementation draft.
     *
     * Complete implementation that strictly follows the plan's mapping table.
     * EVERY field in the plan's Section 3 mapping strategy MUST appear in this
     * draft. Implement:
     *
     * - Namespace with collect() function
     * - All field mappings from plan (direct, connect, nested create)
     * - Neighbor collector reuse (NEVER inline when collector exists)
     * - UUID generation with v4(), proper Prisma CreateInput types
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

  /**
   * Single field/relation mapping strategy.
   *
   * Describes how to handle one specific field or relation in the Prisma
   * CreateInput. Must be provided for EVERY field in the schema - even if not
   * applicable or not needed.
   */
  export interface IMapping {
    /**
     * Exact field or relation name from Prisma schema.
     *
     * MUST match the schema exactly (case-sensitive). Examples:
     *
     * - Scalar fields: "id", "email", "created_at"
     * - BelongsTo relations: "customer", "article"
     * - HasMany relations: "comments", "shopping_sale_tags"
     *
     * DO NOT use database column names (e.g., "customer_id" is WRONG - use
     * "customer").
     *
     * Include ALL fields from the schema, even if they are optional or not
     * used in this particular collector.
     */
    prismaMember: string;

    /**
     * Brief one-line explanation of how to obtain this field's value.
     *
     * Keep it concise and clear. Examples:
     *
     * - "Generate with v4()"
     * - "From props.body.email"
     * - "Connect using props.references.customer_id"
     * - "Nested create with ShoppingSaleTagCollector"
     * - "Query comment to get article_id"
     * - "Default to new Date()"
     * - "Undefined (nullable FK)"
     * - "Not applicable for this collector"
     * - "Not needed (optional has-many)"
     *
     * Even if a field is not used, you MUST include it in the mapping and
     * explain why it's not applicable. This ensures complete schema coverage.
     *
     * This is NOT code - just a simple description of the strategy.
     */
    how: string;
  }

  export interface IReviseProps {
    /**
     * Critical review and improvement analysis.
     *
     * MUST systematically verify using four checklists:
     *
     * 1. Schema Fidelity - Cross-check EVERY field name against plan Section 1
     *    inventory
     * 2. Plan Adherence - Verify EVERY mapping from plan Section 3 is implemented
     * 3. System Rules - Mandatory neighbor reuse, props structure, satisfies type
     * 4. Type Safety - Compilation check, nullable handling, async/await
     *
     * Identify specific issues with line numbers and provide clear reasoning.
     * This catches hallucinated fields, missing mappings, and rule violations.
     */
    review: string;

    /**
     * Final collector code with all review improvements applied.
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
