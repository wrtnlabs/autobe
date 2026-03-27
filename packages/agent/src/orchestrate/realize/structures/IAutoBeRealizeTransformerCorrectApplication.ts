import {
  AutoBeRealizeTransformerSelectMapping,
  AutoBeRealizeTransformerTransformMapping,
} from "@autobe/interface";

import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";

export interface IAutoBeRealizeTransformerCorrectApplication {
  /**
   * Process transformer correction task or preliminary data requests.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeRealizeTransformerCorrectApplication.IProps): void;
}

export namespace IAutoBeRealizeTransformerCorrectApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * For preliminary requests: what critical information is missing?
     *
     * For completion: what did you acquire, what did you accomplish, why is it
     * sufficient? Summarize — don't enumerate every single item.
     */
    thinking: string;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union, physically preventing repeated calls.
     */
    request: IComplete | IAutoBePreliminaryGetDatabaseSchemas;
  }

  /** Correct transformer compilation errors via think/draft/revise. */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /**
     * Systematic error analysis. MUST contain four sections:
     *
     * 1. Error Inventory — categorize ALL compilation errors by root cause
     * 2. Root Cause Analysis — identify WHY each error occurs (wrong field, wrong
     *    transform, etc.)
     * 3. Schema Verification — cross-check error-related fields against actual
     *    database schema
     * 4. Correction Strategy — specific fix for each error in BOTH select() and
     *    transform()
     *
     * This forces you to understand the REAL problem (not guess) and plan
     * surgical fixes that address root causes, not symptoms.
     */
    think: string;

    /**
     * Selection mapping verification for select(). For each database field
     * needed by transform(), document:
     *
     * - `member`: Exact Prisma field/relation name (snake_case) — verify against
     *   the Relation Mapping Table and member list
     * - `kind`: scalar, belongsTo, hasOne, or hasMany
     * - `nullable`: true/false for scalar/belongsTo, null for hasMany/hasOne
     * - `how`: Current state + correction plan ("No change needed", "Fix: wrong
     *   field name", etc.)
     *
     * **Common selection errors to identify**:
     *
     * - Wrong field name (typo or doesn't exist in schema)
     * - Missing required field (transform() uses it but select() doesn't)
     * - Wrong syntax (true for relation, or nested select for scalar)
     *
     * Missing even a single required field will cause validation failure.
     */
    selectMappings: AutoBeRealizeTransformerSelectMapping[];

    /**
     * Transform mapping verification. MUST include EVERY DTO property.
     *
     * - `property`: Exact DTO property name (camelCase)
     * - `how`: Current state + correction plan ("No change needed", "Fix:
     *   [problem] → [solution]")
     *
     * Even correct properties must be included with "No change needed" to
     * ensure complete review.
     *
     * Missing even a single property will cause validation failure.
     */
    transformMappings: AutoBeRealizeTransformerTransformMapping[];

    /**
     * Complete corrected code. EVERY error from think Section 1 MUST be
     * addressed. Implement:
     *
     * - Field name corrections in select() (exact database field names)
     * - Type casts in transform() (Decimal→Number, DateTime→ISO)
     * - Neighbor transformer reuse (replace inline logic if transformer exists)
     *
     * Apply fixes surgically — change ONLY what's broken, preserve working
     * logic.
     */
    draft: string;

    /** Reviews draft corrections and produces final error-free code. */
    revise: IReviseProps;
  }

  export interface IReviseProps {
    /**
     * MUST systematically verify four checklists:
     *
     * 1. Error Resolution — confirm EVERY error from think Section 1 is fixed
     * 2. Root Cause Fix — verify fixes address root causes (not workarounds/hacks)
     * 3. System Rules — neighbor reuse, select (not include), proper types
     * 4. No Regression — confirm no NEW errors, Payload type matches select()
     *
     * Catch Band-Aid fixes (any casts, type assertions) that hide real
     * problems.
     */
    review: string;

    /**
     * Final error-free code with all corrections applied, or null if draft
     * needs no changes.
     */
    final: string | null;
  }
}
