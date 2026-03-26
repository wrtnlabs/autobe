import { AutoBeTestPrepareMapping } from "@autobe/interface";

import { IComplete } from "../../common/structures/IComplete";

/**
 * Function calling interface for generating test data preparation functions.
 *
 * Guides the AI agent through creating reusable prepare functions that generate
 * realistic, constraint-compliant test data for E2E testing. Each prepare
 * function handles DeepPartial input for test customization and RandomGenerator
 * utilities for realistic data generation.
 *
 * The generation follows a write-validate-correct workflow: code generation →
 * external TypeScript compilation → error feedback → correction → completion.
 * All necessary DTO type information is provided directly via the assistant
 * message.
 *
 * @author Michael
 * @author Samchon
 */
export interface IAutoBeTestPrepareWriteApplication {
  /**
   * Submit test data preparation function or confirm completion.
   *
   * Generates complete prepare function through write-validate-correct loop.
   * The submitted code is compiled externally; compilation failures produce
   * diagnostic errors that feed back for correction.
   *
   * @param props Request containing either code submission or completion
   *   confirmation
   */
  process(props: IAutoBeTestPrepareWriteApplication.IProps): void;
}

export namespace IAutoBeTestPrepareWriteApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before submitting code or confirming completion, reflect on your current
     * state and explain your reasoning:
     *
     * For write submissions:
     *
     * - What DTO structure are you targeting?
     * - What data generation strategy will you use?
     * - If retrying after failure, what specific compilation errors are you
     *   fixing?
     *
     * For completion:
     *
     * - What code did you submit?
     * - Why did it pass compilation?
     * - Summarize the key implementation decisions.
     *
     * This reflection helps you produce correct code and avoid repeated errors.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform:
     *
     * - "write": Submit prepare function code for external compilation validation
     * - "complete": Confirm and finalize after successful compilation
     *
     * The "complete" option is only available after a write submission has
     * passed TypeScript compilation. Before that, only "write" is available in
     * the union.
     */
    request: IWrite | IComplete;
  }

  /**
   * Submit prepare function implementation for validation.
   *
   * The submitted code will be compiled externally. If compilation fails, you
   * will receive diagnostic errors and should submit a corrected version.
   *
   * Follows plan → mappings → draft → revise pattern to ensure completeness and
   * correctness.
   */
  export interface IWrite {
    /** Type discriminator for write request. */
    type: "write";

    /**
     * Narrative plan and analysis strategy.
     *
     * Your planning should accomplish these objectives:
     *
     * 1. Understand the DTO Structure - Read through the actual DTO type
     *    carefully, noting property names, types, and validation constraints
     * 2. Classify Properties - Test-customizable vs auto-generated fields
     * 3. Plan Data Generation Strategy - Think through how each property should
     *    generate realistic data
     *
     * This reflection helps you avoid omissions and incorrect data generation.
     */
    plan: string;

    /**
     * Property-by-property mapping table for complete DTO coverage.
     *
     * MUST include EVERY property from the DTO schema - no exceptions. Each
     * mapping specifies:
     *
     * - `property`: Exact property name from DTO schema
     * - `how`: How to generate the value for that property
     *
     * The `mappings` field is your Chain-of-Thought (CoT) mechanism - it forces
     * you to explicitly think through EVERY property before coding, preventing
     * omissions and incorrect data generation.
     *
     * Missing even a single property will cause validation failure and trigger
     * regeneration.
     *
     * This structured approach:
     *
     * - Prevents property omissions through systematic coverage
     * - Forces explicit decision-making for each property
     * - Enables validation before code generation
     * - Creates clear documentation of data generation strategy
     *
     * The validator will cross-check this list against the actual DTO schema
     * and reject incomplete mappings.
     */
    mappings: AutoBeTestPrepareMapping[];

    /**
     * Initial implementation of the prepare function.
     *
     * Complete implementation that strictly follows the plan's mapping table.
     * EVERY property in the mappings MUST appear in this draft. Implement:
     *
     * - Function with DeepPartial<ICreate> input parameter (NEVER Partial)
     * - All property generation from mappings
     * - RandomGenerator utilities for realistic data
     * - Proper nested object/array handling with conditional mapping
     */
    draft: string;

    /**
     * Revision and finalization phase.
     *
     * Reviews the draft implementation and produces the final code with all
     * improvements and corrections applied.
     */
    revise: IReviseProps;
  }

  /**
   * Review and final optimization properties.
   *
   * Contains the critical self-review analysis and the final production-ready
   * implementation with all identified issues corrected.
   */
  export interface IReviseProps {
    /**
     * Critical review and improvement analysis.
     *
     * MUST systematically verify using these checklists:
     *
     * 1. Schema Fidelity - Cross-check EVERY property name against the DTO schema,
     *    verify all properties are generated, no fabricated properties
     * 2. Type Safety - DeepPartial<> used (not Partial<>), proper typing, correct
     *    nested handling
     * 3. Constraint Compliance - String lengths, number bounds, formats, enums
     * 4. Code Quality - Compilation check, template literal syntax, no errors
     *
     * Identify specific issues with reasoning and provide clear fixes. This
     * catches hallucinated properties, missing mappings, and rule violations.
     */
    review: string;

    /**
     * Final prepare function code with all review improvements applied.
     *
     * Apply ALL fixes identified in the review to produce production-ready
     * code. If review found issues, this MUST contain the corrected
     * implementation.
     *
     * Return `null` ONLY if the draft is already perfect and review found zero
     * issues.
     */
    final: string | null;
  }
}
