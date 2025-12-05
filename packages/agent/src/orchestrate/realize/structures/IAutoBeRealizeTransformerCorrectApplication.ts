import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

export interface IAutoBeRealizeTransformerCorrectApplication {
  /**
   * Process transformer correction task or preliminary data requests.
   *
   * Systematically analyzes and corrects TypeScript compilation errors in
   * transformer functions through three-phase workflow (think → draft →
   * revise). Maintains business logic integrity while resolving all compilation
   * issues.
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
   * Request to correct transformer implementation errors.
   *
   * Executes three-phase error correction to resolve TypeScript compilation
   * issues in transformer functions. Applies systematic fixes following think →
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
     * 2. Root Cause Analysis - Identify WHY each error occurs (wrong field, wrong
     *    transform, etc.)
     * 3. Schema Verification - Cross-check error-related fields against actual
     *    Prisma schema
     * 4. Correction Strategy - Specific fix for each error in BOTH select() and
     *    transform()
     *
     * This forces you to understand the REAL problem (not guess) and plan
     * surgical fixes that address root causes, not symptoms.
     */
    think: string;

    /**
     * Initial correction implementation.
     *
     * Complete corrected code that applies ALL fixes from the think phase
     * strategy. EVERY error in think Section 1 inventory MUST be addressed.
     * Implement:
     *
     * - Field name corrections in select() (exact Prisma field names)
     * - Type casts in transform() (Decimal→Number, DateTime→ISO)
     * - Neighbor transformer reuse (replace inline logic if transformer exists)
     * - Function order fix (transform → select → Payload)
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
     * 3. System Rules - Mandatory neighbor reuse, select (not include), proper
     *    types
     * 4. No Regression - Confirm no NEW errors, Payload type matches select()
     *
     * Identify any remaining issues with line numbers and root cause analysis.
     * Catch Band-Aid fixes (any casts, type assertions) that hide real
     * problems.
     */
    review: string;

    /**
     * Final error-free transformer code with all corrections applied.
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
