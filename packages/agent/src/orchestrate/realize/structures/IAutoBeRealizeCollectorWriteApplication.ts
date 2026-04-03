import { AutoBeRealizeCollectorMapping } from "@autobe/interface";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";

/**
 * Generates collector functions that convert API request DTOs to Prisma
 * database inputs (API → DB) via plan/draft/revise workflow.
 */
export interface IAutoBeRealizeCollectorWriteApplication {
  /**
   * Process collector generation task.
   *
   * @param props Preliminary data request, write submission, or completion
   *   confirmation
   */
  process(props: IAutoBeRealizeCollectorWriteApplication.IProps): void;
}

export namespace IAutoBeRealizeCollectorWriteApplication {
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

  /** Generate collector module via plan/draft/revise. */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

    /**
     * Collector implementation plan. MUST contain four sections:
     *
     * 1. Database Schema Field Inventory — ALL fields with exact names from schema
     * 2. DTO Property Inventory — ALL properties with types
     * 3. Field-by-Field Mapping Strategy — explicit mapping for every field
     * 4. Edge Cases and Special Handling — nullable, arrays, conditionals
     *
     * This forces you to READ the actual schema (not imagine it) and creates an
     * explicit specification that the draft must implement.
     */
    plan: string;

    /**
     * Field-by-field mapping for complete database coverage.
     *
     * MUST include EVERY field and relation from the database schema — no
     * exceptions. Each mapping specifies:
     *
     * - `member`: Exact Prisma field/relation name — read from schema, NOT from
     *   DTO property names or FK column names
     * - `kind`: scalar, belongsTo, hasOne, or hasMany
     * - `nullable`: true/false for scalar/belongsTo, null for hasMany/hasOne
     * - `how`: How to obtain/generate the value for that field
     *
     * The `kind` property forces explicit classification BEFORE deciding how to
     * handle it, preventing errors like treating belongsTo as scalar.
     *
     * Missing even a single field will cause validation failure.
     */
    mappings: AutoBeRealizeCollectorMapping[];

    /**
     * Complete implementation following plan's mapping table. EVERY field from
     * plan Section 3 MUST appear. Implement:
     *
     * - Namespace with collect() function
     * - All field mappings (direct, connect, nested create)
     * - Neighbor collector reuse (NEVER inline when collector exists)
     * - UUID generation with v4(), proper Prisma CreateInput types
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
     * 2. Plan Adherence — verify EVERY mapping from Section 3 is implemented
     * 3. System Rules — neighbor reuse, props structure, satisfies type
     * 4. Type Safety — compilation check, nullable handling, async/await
     *
     * Identify issues with line numbers. This catches hallucinated fields,
     * missing mappings, and rule violations.
     */
    review: string;

    /**
     * Final collector code with all review improvements applied, or null if
     * draft needs no changes.
     */
    final: string | null;
  }
}
