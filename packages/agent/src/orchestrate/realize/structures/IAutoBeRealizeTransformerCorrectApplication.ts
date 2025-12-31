import {
  AutoBeRealizeTransformerSelectMapping,
  AutoBeRealizeTransformerTransformMapping,
} from "@autobe/interface";

import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";

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
     * For preliminary requests (getDatabaseSchemas):
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
     * (getDatabaseSchemas) or final error correction (complete). When
     * preliminary returns empty array, that type is removed from the union,
     * physically preventing repeated calls.
     */
    request: IComplete | IAutoBePreliminaryGetDatabaseSchemas;
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
     *    database schema
     * 4. Correction Strategy - Specific fix for each error in BOTH select() and
     *    transform()
     *
     * This forces you to understand the REAL problem (not guess) and plan
     * surgical fixes that address root causes, not symptoms.
     */
    think: string;

    /**
     * Database field-by-field selection mapping verification for the select()
     * function.
     *
     * Review which database fields/relations are being selected to identify
     * missing selections or incorrect field names that cause compilation
     * errors.
     *
     * For each database field needed by transform(), document:
     *
     * - `member`: Exact database field/relation name (snake_case) - verify against
     *   schema
     * - `kind`: Whether it's a scalar field, belongsTo, hasOne, or hasMany
     *   relation
     * - `nullable`: Whether the field/relation is nullable (true/false for
     *   scalar/belongsTo, null for hasMany/hasOne)
     * - `how`: Current state + correction plan ("No change needed", "Fix: wrong
     *   field name", etc.)
     *
     * The `kind` property helps identify selection syntax errors (e.g., using
     * `field: true` for a relation instead of nested select).
     *
     * The `nullable` property helps catch nullability mismatch errors in
     * transform().
     *
     * **Common selection errors to identify**:
     *
     * - Wrong field name (typo or doesn't exist in schema)
     * - Missing required field (transform() uses it but select() doesn't fetch
     *   it)
     * - Wrong selection syntax (true for relation, or nested select for scalar)
     * - Selecting field that doesn't exist in database model
     * - Missing aggregation (_count, _sum) when transform() needs it
     *
     * This structured verification:
     *
     * - Catches missing field selections before runtime
     * - Identifies field name typos by comparing with schema
     * - Ensures select() provides all data transform() needs
     * - Documents what corrections are needed for selection logic
     * - Prevents "field not found" errors
     *
     * The validator will cross-check this against the database schema to ensure
     * all field names are valid and complete coverage.
     *
     * **Note**: If compilation succeeds, select() is typically correct. This
     * mapping is mainly for cases where select() has errors (wrong field names,
     * missing selections).
     */
    selectMappings: AutoBeRealizeTransformerSelectMapping[];

    /**
     * DTO property-by-property mapping verification for the transform()
     * function.
     *
     * Review EVERY property from the DTO type definition to ensure correct
     * transformation in the transform() function. This systematic approach
     * catches errors beyond what the compiler reports and prevents new issues.
     *
     * For each DTO property in transform(), document:
     *
     * - `property`: Exact DTO property name (camelCase)
     * - `how`: Current state + correction plan ("No change needed", "Fix:
     *   [problem] → [solution]", etc.)
     *
     * Even properties without errors should be included with "No change needed"
     * to ensure complete review. Missing even a single property could hide
     * bugs.
     *
     * This structured verification:
     *
     * - Catches silent errors compiler didn't report
     * - Ensures no properties accidentally omitted in transform()
     * - Documents transformation corrections explicitly
     * - Verifies transform() logic correctness
     * - Prevents regression in working transformations
     *
     * **Common correction scenarios in transform()**:
     *
     * - Missing type conversion (Decimal → Number, DateTime → ISO)
     * - Wrong property name (DTO vs database mismatch)
     * - Inline transformation when neighbor transformer exists
     * - Missing computed property
     * - Wrong nullable handling (DateTime? → string | null)
     * - Fabricated property not in DTO
     * - Missing property from DTO
     * - Missing await for async transformers
     *
     * The validator will cross-check this against the DTO type definition to
     * ensure nothing was overlooked.
     *
     * **Note**: This mapping is ONLY for the transform() function. The select()
     * function is typically correct if compilation succeeds, as it's
     * structurally simpler.
     */
    transformMappings: AutoBeRealizeTransformerTransformMapping[];

    /**
     * Initial correction implementation.
     *
     * Complete corrected code that applies ALL fixes from the think phase
     * strategy. EVERY error in think Section 1 inventory MUST be addressed.
     * Implement:
     *
     * - Field name corrections in select() (exact database field names)
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
