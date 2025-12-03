export interface IAutoBeTestPrepareWriteApplication {
  /**
   * Generates type-safe test data preparation functions for E2E testing.
   *
   * This function analyzes ICreate DTO schemas and generates prepare functions
   * that create realistic, constraint-compliant test data while including only
   * fields that benefit from test-time customization in input parameters.
   *
   * Key responsibilities:
   * - Classify properties into test-customizable vs auto-generated fields
   * - Generate functions using DeepPartial<ICreate> pattern (NEVER Partial)
   * - Utilize RandomGenerator utilities for realistic data generation
   * - Respect all schema validation constraints (min/max, patterns, formats)
   *
   * @param props Complete prepare function specification with draft, review, and final code
   */
  write(props: IAutoBeTestPrepareWriteApplication.IProps): void;
}

export namespace IAutoBeTestPrepareWriteApplication {
  /**
   * Properties for generating a test data preparation function.
   */
  export interface IProps {
    /**
     * Initial implementation of the prepare function.
     *
     * Must follow the pattern:
     * ```typescript
     * import { RandomGenerator } from "@nestia/e2e";
     * import { randint } from "tstl";
     * import { v4 } from "uuid";
     *
     * import { I[Entity] } from "@ORGANIZATION/PROJECT-api/lib/structures/I[Entity]";
     *
     * export const prepare_random_[entity] = (
     *   input?: DeepPartial<I[Entity].ICreate>
     * ): I[Entity].ICreate => ({...})
     * ```
     *
     * Requirements:
     * - Import namespaces for DTOs (e.g., IBbsArticle, not IBbsArticle.ICreate)
     * - Use DeepPartial<> to explicitly select test-customizable fields
     * - NEVER use Partial<> for input parameter type
     * - Generate auto-fields (id, timestamps) internally
     * - Use RandomGenerator utilities for realistic data
     */
    draft: string;

    /**
     * Name of the prepare function.
     *
     * Format: `prepare_random_[entity_name]`
     * - IUser.ICreate → prepare_random_user
     * - IBbsArticle.ICreate → prepare_random_bbs_article  
     * - IShoppingSale.ICreate → prepare_random_shopping_sale
     * - IOrder.ICreate → prepare_random_order
     */
    functionName: string;

    /**
     * Review and optimization phase for the prepare function.
     */
    revise: IReviseProps;
  }

  /**
   * Review and final optimization properties.
   */
  export interface IReviseProps {
    /**
     * Field selection and quality review of the draft implementation.
     *
     * Checks for:
     * - Proper use of DeepPartial<> instead of Partial<>
     * - Inclusion of only test-beneficial fields in input parameter
     * - Realistic data generation patterns
     * - Constraint compliance (validation rules)
     * - Proper use of RandomGenerator utilities
     */
    review: string;

    /**
     * Final optimized implementation after review.
     *
     * Contains the production-ready prepare function with:
     * - Optimal field selection for test efficiency
     * - Optimized RandomGenerator usage
     * - Complete constraint compliance
     * - Clean, maintainable code structure
     *
     * If null, the draft is used as-is.
     */
    final: string | null;
  }
}