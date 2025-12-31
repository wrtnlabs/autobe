import { AutoBeRealizeCollectorMapping } from "@autobe/interface";

import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";

/**
 * Function calling interface for generating DTO collector functions.
 *
 * Guides the AI agent through creating reusable collector modules that prepare
 * database input data from API request DTOs (API → DB). Each collector handles
 * complex nested relationships, UUID generation, and proper Prisma
 * connect/create syntax.
 *
 * The generation follows a structured RAG workflow: preliminary context
 * gathering (database schemas only) → implementation planning → code generation →
 * review and refinement. All necessary DTO type information is obtained
 * transitively from the DTO type names provided in the plan
 * (AutoBeRealizeCollectorPlan).
 */
export interface IAutoBeRealizeCollectorWriteApplication {
  /**
   * Process collector generation task or preliminary data requests.
   *
   * Generates complete collector module through three-phase workflow (plan →
   * draft → revise). Ensures type safety, proper database input types, and
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
     * - What database schemas are missing that you need?
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
     * the DTO type names in the plan. You only need to request database schemas.
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
     * - "getDatabaseSchemas": Retrieve database table schemas for DB structure
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
    request: IComplete | IAutoBePreliminaryGetDatabaseSchemas;
  }

  /**
   * Request to generate collector module implementation.
   *
   * Executes three-phase generation to create complete collector with:
   *
   * - Collect() function: Converts DTO to database input
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
     * 1. Database Schema Field Inventory - List ALL fields with exact names from
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
     * Field-by-field mapping table for complete database coverage.
     *
     * MUST include EVERY field and relation from the database schema - no
     * exceptions. Each mapping specifies:
     *
     * - `member`: Exact field/relation name from database schema
     * - `kind`: Whether it's a scalar field, belongsTo, hasOne, or hasMany
     *   relation
     * - `nullable`: Whether the field/relation is nullable (true/false for
     *   scalar/belongsTo, null for hasMany/hasOne)
     * - `how`: How to obtain/generate the value for that field
     *
     * The `kind` property forces explicit classification of each member BEFORE
     * deciding how to handle it, preventing common errors like treating
     * belongsTo relations as scalar fields.
     *
     * The `nullable` property forces explicit identification of nullability
     * constraints BEFORE deciding handling strategy, preventing errors like
     * assigning null to non-nullable fields or using null instead of undefined
     * for optional relations.
     *
     * Missing even a single field will cause validation failure and trigger
     * regeneration.
     *
     * This structured approach:
     *
     * - Prevents field omissions through systematic coverage
     * - Forces explicit decision-making for each field (kind + nullable + how)
     * - Prevents confusion between scalar fields and relations
     * - Prevents null assignment errors through explicit nullability tracking
     * - Enables validation before code generation
     * - Creates clear documentation of field handling strategy
     *
     * The validator will cross-check this list against the actual database schema
     * and reject incomplete mappings.
     */
    mappings: AutoBeRealizeCollectorMapping[];

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
