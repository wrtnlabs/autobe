import { AutoBeRealizeCollectorMapping } from "@autobe/interface";

import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

export interface IAutoBeRealizeCollectorCorrectApplication {
  /**
   * Process collector correction task or preliminary data requests.
   *
   * Systematically analyzes and corrects TypeScript compilation errors in
   * collector functions through three-phase workflow (think → draft → revise).
   * Maintains business logic integrity while resolving all compilation issues.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeRealizeCollectorCorrectApplication.IProps): void;
}

export namespace IAutoBeRealizeCollectorCorrectApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests (getPrismaSchemas):
     *
     * - What critical information is missing that you don't already have?
     * - Why do you need it specifically right now?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For completion (complete):
     *
     * - What key assets did you acquire?
     * - What did you accomplish?
     * - Why is it sufficient to complete?
     * - Summarize - don't enumerate every single item.
     *
     * This reflection helps you avoid duplicate requests and premature
     * completion.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getPrismaSchemas) or final error correction (complete). When preliminary
     * returns empty array, that type is removed from the union, physically
     * preventing repeated calls.
     */
    request: IComplete | IAutoBePreliminaryGetPrismaSchemas;
  }

  /**
   * Request to correct collector implementation errors.
   *
   * Executes three-phase error correction to resolve TypeScript compilation
   * issues in collector functions. Applies systematic fixes following think →
   * draft → revise pattern to ensure error-free production code.
   */
  export interface IComplete {
    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval or actual
     * task execution. Value "complete" indicates this is the final task
     * execution request.
     */
    type: "complete";

    /**
     * Systematic error analysis and correction strategy.
     *
     * MUST contain thorough analysis with these four mandatory sections:
     *
     * 1. Error Inventory - Categorize ALL compilation errors by root cause type
     * 2. Root Cause Analysis - Identify WHY each error occurs (wrong field, type
     *    mismatch, etc.)
     * 3. Schema Verification - Cross-check error-related fields against actual
     *    Prisma schema
     * 4. Correction Strategy - Specific fix for each error (not workarounds)
     *
     * This forces you to understand the REAL problem (not guess) and plan
     * surgical fixes that address root causes, not symptoms.
     */
    think: string;

    /**
     * Field-by-field mapping verification for complete coverage.
     *
     * Review EVERY field and relation from the Prisma schema to ensure correct
     * handling. This systematic approach catches errors beyond what the
     * compiler reports and prevents new issues.
     *
     * For each Prisma member, document:
     *
     * - `member`: Exact field/relation name from Prisma schema
     * - `kind`: Whether it's a scalar field, belongsTo, hasOne, or hasMany
     *   relation
     * - `nullable`: Whether the field/relation is nullable (true/false for
     *   scalar/belongsTo, null for hasMany/hasOne)
     * - `how`: Current state + correction plan ("No change needed", "Fix:
     *   [problem] → [solution]", etc.)
     *
     * The `kind` property forces you to consciously identify whether each
     * member is a scalar or relation BEFORE deciding how to fix it. This
     * prevents common correction errors like treating belongsTo relations as
     * scalar fields.
     *
     * The `nullable` property forces you to explicitly identify nullability
     * constraints BEFORE deciding correction strategy. This prevents errors like
     * assigning null to non-nullable fields or using null instead of undefined
     * for optional belongsTo relations.
     *
     * Even fields without errors should be included with "No change needed" to
     * ensure complete review. Missing even a single field could hide bugs.
     *
     * This structured verification:
     *
     * - Catches silent errors compiler didn't report
     * - Ensures no fields accidentally omitted
     * - Forces explicit classification (kind + nullable) before correction (how)
     * - Prevents confusion between scalar fields and relations
     * - Prevents null assignment errors through explicit nullability tracking
     * - Documents correction decisions explicitly
     * - Prevents regression in working fields
     *
     * The validator will cross-check this against the Prisma schema to ensure
     * nothing was overlooked.
     */
    mappings: AutoBeRealizeCollectorMapping[];

    /**
     * Initial correction implementation.
     *
     * Complete corrected code that applies ALL fixes from the think phase
     * strategy. EVERY error in think Section 1 inventory MUST be addressed.
     * Implement:
     *
     * - Field name corrections (exact names from Prisma schema)
     * - Type fixes (proper CreateInput types, nullable handling)
     * - Neighbor collector reuse (replace inline logic if collector exists)
     * - Relationship fixes (connect/create syntax)
     *
     * Apply fixes surgically - change ONLY what's broken, preserve working
     * logic.
     */
    draft: string;

    /**
     * Revision and finalization phase.
     *
     * Reviews the draft corrections and produces the final, error-free code
     * that maintains all business requirements.
     */
    revise: IReviseProps;
  }

  export interface IReviseProps {
    /**
     * Critical correction review and validation.
     *
     * MUST systematically verify using four checklists:
     *
     * 1. Error Resolution - Confirm EVERY error from think Section 1 is fixed
     * 2. Root Cause Fix - Verify fixes address root causes (not workarounds/hacks)
     * 3. System Rules - Mandatory neighbor reuse, proper types, no fabricated
     *    fields
     * 4. No Regression - Confirm no NEW errors introduced, business logic intact
     *
     * Identify any remaining issues with line numbers and root cause analysis.
     * Catch Band-Aid fixes (type assertions, any casts) that hide real
     * problems.
     */
    review: string;

    /**
     * Final error-free collector code with all corrections applied.
     *
     * Apply ALL remaining fixes identified in the review to produce
     * compilation-ready code. If review found issues (workarounds, new errors),
     * this MUST contain proper fixes.
     *
     * Return `null` ONLY if draft is already perfect and review found zero
     * issues.
     */
    final: string | null;
  }
}
