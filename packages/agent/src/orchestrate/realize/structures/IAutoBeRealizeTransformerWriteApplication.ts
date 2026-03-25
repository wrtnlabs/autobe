import {
  AutoBeRealizeTransformerSelectMapping,
  AutoBeRealizeTransformerTransformMapping,
} from "@autobe/interface";

import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";

/**
 * Generates transformer functions that convert Prisma query results to API
 * response DTOs (DB to API).
 */
export interface IAutoBeRealizeTransformerWriteApplication {
  /** Process task or retrieve preliminary data. */
  process(props: IAutoBeRealizeTransformerWriteApplication.IProps): void;
}

export namespace IAutoBeRealizeTransformerWriteApplication {
  export interface IProps {
    /**
     * Reasoning about your current state: what's missing (preliminary) or what
     * you accomplished (completion).
     */
    thinking: string;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union.
     */
    request: IComplete | IAutoBePreliminaryGetDatabaseSchemas;
  }

  /**
   * Generate transformer module (select + transform functions) via
   * plan/draft/revise.
   */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /**
     * MUST contain four sections:
     *
     * 1. Database Schema Field Inventory - ALL fields with exact names
     * 2. DTO Property Inventory - ALL properties with types
     * 3. Field-by-Field Mapping Strategy - explicit table for BOTH select() and
     *    transform()
     * 4. Edge Cases and Special Handling - type casts (Decimal, DateTime),
     *    nullables
     */
    plan: string;

    /**
     * MUST include EVERY database field needed by transform(). Each entry:
     * `member` (exact DB field name, snake_case), `kind`
     * (scalar/belongsTo/hasOne/hasMany), `nullable` (true/false for
     * scalar/belongsTo, null for hasMany/hasOne), `how` (which DTO property
     * needs it).
     *
     * Missing even a single required field will cause validation failure.
     */
    selectMappings: AutoBeRealizeTransformerSelectMapping[];

    /**
     * MUST include EVERY property from the DTO type definition. Each entry:
     * `property` (exact camelCase name), `how` (how to obtain from Prisma
     * payload).
     *
     * Missing even a single property will cause validation failure.
     */
    transformMappings: AutoBeRealizeTransformerTransformMapping[];

    /**
     * Complete implementation following plan's mapping table. EVERY field from
     * plan Section 3 MUST appear in BOTH select() and transform(). NEVER inline
     * when neighbor transformer exists. ALWAYS use `select`, NEVER `include`.
     */
    draft: string;

    /** Reviews draft and produces final code. */
    revise: IReviseProps;
  }

  export interface IReviseProps {
    /**
     * MUST verify: 1) schema fidelity, 2) plan adherence in BOTH select() and
     * transform(), 3) system rules (neighbor reuse, function order, select not
     * include), 4) type safety (Decimal/DateTime casts, nullable). Identify
     * issues with line numbers.
     */
    review: string;

    /** Final code, or null if draft needs no changes. */
    final: string | null;
  }
}
