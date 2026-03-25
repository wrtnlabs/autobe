import { AutoBeRealizeCollectorMapping } from "@autobe/interface";

import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";

export interface IAutoBeRealizeCollectorCorrectApplication {
  /** Process task or retrieve preliminary data. */
  process(props: IAutoBeRealizeCollectorCorrectApplication.IProps): void;
}

export namespace IAutoBeRealizeCollectorCorrectApplication {
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

  /** Request to correct collector compilation errors via think/draft/revise. */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /**
     * MUST contain four sections:
     *
     * 1. Error Inventory - Categorize ALL compilation errors by root cause
     * 2. Root Cause Analysis - Identify WHY each error occurs
     * 3. Schema Verification - Cross-check fields against actual database schema
     * 4. Correction Strategy - Specific fix for each error (not workarounds)
     */
    think: string;

    /**
     * Field-by-field mapping verification. MUST include EVERY field/relation
     * from the database schema. Each entry: `member` (exact name), `kind`
     * (scalar/belongsTo/hasOne/hasMany), `nullable` (true/false for
     * scalar/belongsTo, null for hasMany/hasOne), `how` (correction plan or "No
     * change needed").
     *
     * Missing even a single field will cause validation failure.
     */
    mappings: AutoBeRealizeCollectorMapping[];

    /**
     * Complete corrected code. EVERY error from think Section 1 MUST be
     * addressed. Apply fixes surgically - change ONLY what's broken, preserve
     * working logic.
     */
    draft: string;

    /** Reviews draft and produces final error-free code. */
    revise: IReviseProps;
  }

  export interface IReviseProps {
    /**
     * MUST verify: 1) every error fixed, 2) root cause fixes (not workarounds),
     * 3) system rules followed, 4) no regressions. Catch Band-Aid fixes (type
     * assertions, any casts).
     */
    review: string;

    /** Final code, or null if draft needs no changes. */
    final: string | null;
  }
}
