import {
  AutoBeRealizeTransformerSelectMapping,
  AutoBeRealizeTransformerTransformMapping,
} from "@autobe/interface";

import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";

/**
 * Function calling interface for generating DTO transformer functions.
 *
 * Guides the AI agent through creating reusable transformer modules that
 * convert database query results to API response DTOs (DB → API). Each
 * transformer includes type-safe conversion logic and Prisma select
 * specifications for efficient data loading.
 *
 * The generation follows a structured RAG workflow: preliminary context
 * gathering (database schemas only) → implementation planning → code generation →
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
     * - What database schemas are missing that you need?
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
    request: IComplete | IAutoBePreliminaryGetDatabaseSchemas;
  }

  /**
   * Request to generate transformer module implementation.
   *
   * Executes three-phase generation to create complete transformer with:
   *
   * - `select()` function: Returns Prisma include/select specification
   * - `transform()` function: Converts Prisma payload to DTO
   *
   * Follows plan → draft → revise pattern to ensure type safety and correct
   * field mappings.
   *
   * Note: The database schema name is provided as input from the planning phase,
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
     * 1. Database Schema Field Inventory - List ALL fields with exact names from
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
     * Database field-by-field selection mapping for the select() function.
     *
     * Documents which database fields/relations must be selected from the
     * database to enable the transform() function. This ensures no required
     * data is missing from the query.
     *
     * MUST include EVERY database field needed by transform() - no exceptions.
     * Each mapping specifies:
     *
     * - `member`: Exact database field/relation name (snake_case)
     * - `kind`: Whether it's a scalar field, belongsTo, hasOne, or hasMany
     *   relation
     * - `nullable`: Whether the field/relation is nullable (true/false for
     *   scalar/belongsTo, null for hasMany/hasOne)
     * - `how`: Why this field is being selected (which DTO property needs it)
     *
     * The `kind` property forces explicit classification of each member BEFORE
     * deciding what to select, preventing confusion between scalars and
     * relations, and ensuring correct select syntax.
     *
     * The `nullable` property documents schema constraints that affect how
     * transform() will handle the data, enabling proper null handling in
     * transformations.
     *
     * Missing even a single required field will cause validation failure and
     * trigger regeneration.
     *
     * This structured approach:
     *
     * - Prevents missing field selections through systematic coverage
     * - Forces explicit decision-making for each database field (kind + nullable +
     *   how)
     * - Ensures select() and transform() are perfectly aligned
     * - Documents what data to load from database
     * - Prevents confusion between scalar fields and relations
     * - Documents nullability constraints for transform() planning
     * - Enables validation before code generation
     *
     * **Common selection patterns by kind**:
     *
     * - **Scalar fields (nullable: true/false)**: For direct mapping or type
     *   conversion
     * - **Computation sources (nullable: true/false)**: Fields needed for
     *   computed DTO properties
     * - **Aggregations (nullable: false)**: _count, _sum, _avg for DTO statistics
     * - **BelongsTo relations (nullable: true/false)**: For nested object
     *   transformers
     * - **HasMany relations (nullable: null)**: For array transformers
     *
     * The validator will cross-check this list against the database schema and
     * DTO requirements to ensure complete coverage.
     */
    selectMappings: AutoBeRealizeTransformerSelectMapping[];

    /**
     * DTO property-by-property transformation mapping for the transform()
     * function.
     *
     * Documents how to transform database payload data into each DTO property.
     * This ensures complete DTO coverage and correct transformation logic.
     *
     * MUST include EVERY property from the DTO type definition - no exceptions.
     * Each mapping specifies:
     *
     * - `property`: Exact DTO property name (camelCase)
     * - `how`: How to obtain this property value from Prisma payload
     *
     * Missing even a single property will cause validation failure and trigger
     * regeneration.
     *
     * This structured approach:
     *
     * - Prevents property omissions through systematic coverage
     * - Forces explicit decision-making for each property transformation
     * - Documents transformation logic (direct mapping, type conversion,
     *   computation, nested transformation)
     * - Ensures select() and transform() are aligned
     * - Enables validation before code generation
     *
     * **Common transformation patterns**:
     *
     * - **Direct mapping**: Simple field renaming (snake_case → camelCase)
     * - **Type conversion**: Decimal → Number, DateTime → ISO string
     * - **Nullable handling**: DateTime? → string | null
     * - **Computed properties**: Calculate from multiple database fields
     * - **Aggregation**: Use _count, _sum, _avg from database
     * - **Nested objects**: Reuse neighbor transformers
     * - **Arrays**: Map with ArrayUtil.asyncMap + neighbor transformer
     *
     * The validator will cross-check this list against the actual DTO type
     * definition and reject incomplete mappings.
     */
    transformMappings: AutoBeRealizeTransformerTransformMapping[];

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
