/**
 * Traceability interface shared by all SRS items.
 *
 * **Key invariant**: Every traceable entry must have at least one
 * `sourceSectionIds`.
 *
 * This ensures all Semantic Layer items can be traced back to their source
 * sections in the Evidence Layer.
 *
 * @author Juntak
 */
export interface ITraceable {
  /**
   * List of `sectionId` references from the Evidence Layer.
   *
   * Points to the source section(s) from which this item was derived. At least
   * one is required.
   */
  sourceSectionIds: string[];
}
