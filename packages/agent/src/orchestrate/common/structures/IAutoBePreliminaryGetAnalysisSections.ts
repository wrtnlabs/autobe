import { tags } from "typia";

/**
 * Request to retrieve individual analysis sections by numeric ID.
 *
 * Instead of loading entire analysis files (~110-120KB each), this loads
 * specific ### sections (~200-600 words each) identified by integer IDs from
 * the section catalog.
 *
 * @author Juntak
 */
export interface IAutoBePreliminaryGetAnalysisSections {
  /**
   * Type discriminator for the request.
   *
   * Determines which action to perform: preliminary data retrieval or actual
   * task execution. Value "getAnalysisSections" indicates this is a preliminary
   * data request for individual analysis sections.
   */
  type: "getAnalysisSections";

  /**
   * List of section IDs to retrieve.
   *
   * These are sequential integer IDs from the analysis sections catalog. Each
   * ID maps to a specific ### section in the requirements documents.
   *
   * CRITICAL: DO NOT request the same section IDs that you have already
   * requested in previous calls.
   */
  sectionIds: (number & tags.Type<"uint32">)[] &
    tags.MinItems<1> &
    tags.MaxItems<100>;
}
