import {
  AutoBeRealizeTransformerSelectMapping,
  AutoBeRealizeTransformerTransformMapping,
} from "@autobe/interface";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";

/**
 * Generates transformer functions that convert Prisma query results to API
 * response DTOs (DB → API) via plan/draft/revise workflow.
 */
export interface IAutoBeRealizeTransformerWriteApplication {
  /**
   * Process transformer generation task.
   *
   * @param props Preliminary data request, write submission, or completion
   *   confirmation
   */
  process(props: IAutoBeRealizeTransformerWriteApplication.IProps): void;
}

export namespace IAutoBeRealizeTransformerWriteApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * For preliminary requests: what database schemas are missing and why?
     *
     * For write: what you're submitting and key mapping decisions.
     *
     * For complete: why you consider the last write final.
     *
     * Note: All DTO type information is available transitively from the plan's
     * DTO type names. You only need to request database schemas.
     */
    thinking: string;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union, physically preventing repeated calls.
     */
    request:
      | IWrite
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryComplete;
  }

  /**
   * Generate transformer module (select + transform functions) via
   * plan/draft/revise.
   */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

    /**
     * Transformer implementation plan. MUST contain four sections:
     *
     * 1. Database Schema Field Inventory — ALL fields with exact names from schema
     * 2. DTO Property Inventory — ALL properties with types
     * 3. Field-by-Field Mapping Strategy — explicit table for BOTH select() and
     *    transform()
     * 4. Edge Cases and Special Handling — type casts (Decimal, DateTime),
     *    nullables
     *
     * This forces you to READ the actual schema (not imagine it) and creates an
     * explicit specification for both select() and transform() functions.
     */
    plan: string;

    /**
     * Database field-by-field selection mapping for select().
     *
     * MUST include EVERY database field needed by transform() — no exceptions.
     * Each mapping specifies:
     *
     * - `member`: Exact Prisma field/relation name (snake_case) — read from the
     *   Relation Mapping Table and member list, NOT from DTO property names
     * - `kind`: scalar, belongsTo, hasOne, or hasMany
     * - `nullable`: true/false for scalar/belongsTo, null for hasMany/hasOne
     * - `how`: Which DTO property needs it
     *
     * The `kind` property forces explicit classification of each member BEFORE
     * deciding select syntax, preventing confusion between scalars and
     * relations.
     *
     * Missing even a single required field will cause validation failure.
     */
    selectMappings: AutoBeRealizeTransformerSelectMapping[];

    /**
     * DTO property-by-property transformation mapping for transform().
     *
     * MUST include EVERY property from the DTO type definition — no exceptions.
     * Each mapping specifies:
     *
     * - `property`: Exact DTO property name (camelCase)
     * - `how`: How to obtain from Prisma payload
     *
     * **Common transformation patterns**:
     *
     * - Direct mapping: snake_case → camelCase
     * - Type conversion: Decimal → Number, DateTime → ISO string
     * - Nullable: DateTime? → string | null
     * - Nested objects: Reuse neighbor transformers
     * - Arrays: ArrayUtil.asyncMap + neighbor transformer
     *
     * Missing even a single property will cause validation failure.
     */
    transformMappings: AutoBeRealizeTransformerTransformMapping[];

    /**
     * Complete implementation following plan's mapping table. EVERY field from
     * plan Section 3 MUST appear in BOTH select() and transform(). Implement:
     *
     * - Transform() first, select() second, Payload last (correct order)
     * - All field mappings from plan with correct transformations
     * - Neighbor transformer reuse (NEVER inline when transformer exists)
     * - ALWAYS use `select`, NEVER use `include`
     */
    draft: string;

    /** Reviews draft and produces final code. */
    revise: IReviseProps;
  }

  export interface IReviseProps {
    /**
     * MUST systematically verify four checklists:
     *
     * 1. Schema Fidelity — cross-check EVERY field name against plan Section 1
     * 2. Plan Adherence — verify EVERY mapping from Section 3 in BOTH select() and
     *    transform()
     * 3. System Rules — neighbor reuse, function order, select (not include)
     * 4. Type Safety — Decimal→Number, DateTime→ISO, nullable handling
     *
     * Identify issues with line numbers. This catches hallucinated fields,
     * missing transformations, and rule violations.
     */
    review: string;

    /**
     * Final transformer code with all review improvements applied, or null if
     * draft needs no changes.
     */
    final: string | null;
  }
}
