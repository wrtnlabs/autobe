import { AutoBeRealizeCollectorMapping } from "@autobe/interface";

import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";

/**
 * Generates collector functions that convert API request DTOs to Prisma
 * database inputs (API to DB).
 */
export interface IAutoBeRealizeCollectorWriteApplication {
  /** Process task or retrieve preliminary data. */
  process(props: IAutoBeRealizeCollectorWriteApplication.IProps): void;
}

export namespace IAutoBeRealizeCollectorWriteApplication {
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

  /** Generate collector module via plan/draft/revise. */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /**
     * MUST contain four sections:
     *
     * 1. Database Schema Field Inventory - ALL fields with exact names
     * 2. DTO Property Inventory - ALL properties with types
     * 3. Field-by-Field Mapping Strategy - explicit mapping for every field
     * 4. Edge Cases and Special Handling - nullable, arrays, conditionals
     */
    plan: string;

    /**
     * MUST include EVERY field/relation from the database schema. Each entry:
     * `member` (exact name), `kind` (scalar/belongsTo/hasOne/hasMany),
     * `nullable` (true/false for scalar/belongsTo, null for hasMany/hasOne),
     * `how` (how to obtain/generate the value).
     *
     * Missing even a single field will cause validation failure.
     */
    mappings: AutoBeRealizeCollectorMapping[];

    /**
     * Complete implementation following plan's mapping table. EVERY field from
     * plan Section 3 MUST appear. NEVER inline when neighbor collector exists.
     */
    draft: string;

    /** Reviews draft and produces final code. */
    revise: IReviseProps;
  }

  export interface IReviseProps {
    /**
     * MUST verify: 1) schema fidelity, 2) plan adherence, 3) system rules
     * (neighbor reuse, props structure), 4) type safety. Identify issues with
     * line numbers.
     */
    review: string;

    /** Final code, or null if draft needs no changes. */
    final: string | null;
  }
}
