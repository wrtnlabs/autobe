import {
  AutoBeRealizeTransformerSelectMapping,
  AutoBeRealizeTransformerTransformMapping,
} from "@autobe/interface";

import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";

export interface IAutoBeRealizeTransformerCorrectApplication {
  /** Process task or retrieve preliminary data. */
  process(props: IAutoBeRealizeTransformerCorrectApplication.IProps): void;
}

export namespace IAutoBeRealizeTransformerCorrectApplication {
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

  /** Correct transformer compilation errors via think/draft/revise. */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /**
     * MUST contain four sections:
     *
     * 1. Error Inventory - Categorize ALL compilation errors by root cause
     * 2. Root Cause Analysis - Identify WHY each error occurs
     * 3. Schema Verification - Cross-check fields against actual database schema
     * 4. Correction Strategy - Specific fix for each error in BOTH select() and
     *    transform()
     */
    think: string;

    /**
     * Selection mapping verification for select() function. Each entry:
     * `member` (exact DB field name, snake_case), `kind`
     * (scalar/belongsTo/hasOne/hasMany), `nullable` (true/false for
     * scalar/belongsTo, null for hasMany/hasOne), `how` (correction plan or "No
     * change needed").
     *
     * Missing even a single required field will cause validation failure.
     */
    selectMappings: AutoBeRealizeTransformerSelectMapping[];

    /**
     * Transform mapping verification. MUST include EVERY DTO property. Each
     * entry: `property` (exact camelCase name), `how` (correction plan or "No
     * change needed").
     *
     * Missing even a single property will cause validation failure.
     */
    transformMappings: AutoBeRealizeTransformerTransformMapping[];

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
     * 3) system rules (neighbor reuse, select not include), 4) no regressions.
     * Catch Band-Aid fixes (any casts, type assertions).
     */
    review: string;

    /** Final code, or null if draft needs no changes. */
    final: string | null;
  }
}
