import { AutoBeRealizeCollectorMapping } from "@autobe/interface";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";

export interface IAutoBeRealizeCollectorCorrectApplication {
  /**
   * Process collector correction task or preliminary data requests.
   *
   * @param props Preliminary data request, write submission, or completion
   *   confirmation
   */
  process(props: IAutoBeRealizeCollectorCorrectApplication.IProps): void;
}

export namespace IAutoBeRealizeCollectorCorrectApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * For preliminary requests: what critical information is missing?
     *
     * For write: what errors you're fixing and the correction strategy.
     *
     * For complete: why you consider all errors resolved.
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

  /** Correct collector compilation errors via think/draft/revise. */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

    /**
     * Systematic error analysis. MUST contain four sections:
     *
     * 1. Error Inventory — categorize ALL compilation errors by root cause
     * 2. Root Cause Analysis — identify WHY each error occurs (wrong field, type
     *    mismatch, etc.)
     * 3. Schema Verification — cross-check error-related fields against actual
     *    database schema
     * 4. Correction Strategy — specific fix for each error (not workarounds)
     *
     * This forces you to understand the REAL problem (not guess) and plan
     * surgical fixes that address root causes, not symptoms.
     */
    think: string;

    /**
     * Field-by-field mapping verification. For each database schema member:
     *
     * - `member`: Exact Prisma field/relation name — verify against schema
     * - `kind`: scalar, belongsTo, hasOne, or hasMany
     * - `nullable`: true/false for scalar/belongsTo, null for hasMany/hasOne
     * - `how`: Current state + correction plan ("No change needed", "Fix:
     *   [problem] → [solution]")
     *
     * Even fields without errors must be included with "No change needed" to
     * ensure complete review. MUST include EVERY field/relation from the
     * database schema.
     *
     * Missing even a single field will cause validation failure.
     */
    mappings: AutoBeRealizeCollectorMapping[];

    /**
     * Complete corrected code. EVERY error from think Section 1 MUST be
     * addressed. Implement:
     *
     * - Field name corrections (exact names from database schema)
     * - Type fixes (proper CreateInput types, nullable handling)
     * - Neighbor collector reuse (replace inline logic if collector exists)
     * - Relationship fixes (connect/create syntax)
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
     * 3. System Rules — neighbor reuse, proper types, no fabricated fields
     * 4. No Regression — confirm no NEW errors, business logic intact
     *
     * Catch Band-Aid fixes (type assertions, any casts) that hide real
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
