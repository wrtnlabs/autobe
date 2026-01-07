/**
 * Property-by-property data generation mapping for test prepare functions.
 *
 * Explicit mapping ensures complete DTO coverage by documenting generation
 * strategy for each property before implementation.
 */
export interface AutoBeTestPrepareMapping {
  /**
   * Exact property name from the DTO schema.
   *
   * Must match actual DTO property - no fabricated names allowed.
   */
  property: string;

  /**
   * Data generation strategy for this property.
   *
   * Explains how the value will be generated (e.g., "typia.random with uuid
   * format", "RandomGenerator.paragraph with 2-5 sentences", "input override
   * or default generation").
   */
  how: string;
}
