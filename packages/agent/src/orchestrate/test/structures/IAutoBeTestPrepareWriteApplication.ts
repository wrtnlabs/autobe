import { AutoBeTestPrepareMapping } from "@autobe/interface";

/**
 * Function calling interface for generating test data preparation functions.
 *
 * Guides the AI agent through creating reusable prepare functions that generate
 * realistic, constraint-compliant test data for E2E testing. Each prepare
 * function handles DeepPartial input for test customization and RandomGenerator
 * utilities for realistic data generation.
 *
 * The generation follows a structured workflow: narrative planning → property
 * mappings (CoT mechanism) → code generation → review and refinement. All
 * necessary DTO type information is provided directly via the assistant
 * message.
 *
 * @author Michael
 * @author Samchon
 */
export interface IAutoBeTestPrepareWriteApplication {
  /**
   * Generate test data preparation function.
   *
   * Executes three-phase generation to create complete prepare function with:
   *
   * - DeepPartial input for test-time customization
   * - RandomGenerator utilities for realistic data generation
   * - Proper handling of nested structures (objects and arrays)
   * - Constraint compliance (validation rules)
   *
   * Follows plan → mappings → draft → revise pattern to ensure completeness and
   * correctness.
   *
   * @param props Request containing plan, mappings, and implementation phases
   */
  write(props: IAutoBeTestPrepareWriteApplication.IProps): void;
}

export namespace IAutoBeTestPrepareWriteApplication {
  /**
   * Properties for generating a test data preparation function.
   *
   * Contains the complete specification including narrative plan, property
   * mappings, function name, draft implementation, and review/final phases.
   */
  export interface IProps {
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
