import { AutoBeAnalyzeDocumentSrs } from "@autobe/interface";

/**
 * Application interface for the Analyze Document agent.
 *
 * This agent extracts the Semantic Layer (structured SRS data) from a single
 * analysis file's content. Given the file's assembled markdown and its Evidence
 * Layer sections, it produces the appropriate SRS categories with
 * `sourceSectionIds` traceability.
 */
export interface IAutoBeAnalyzeDocumentApplication {
  /**
   * Extract structured SRS data from the analysis file content.
   *
   * @param props Request containing the extraction result
   */
  process(props: IAutoBeAnalyzeDocumentApplicationProps): void;
}

export interface IAutoBeAnalyzeDocumentApplicationProps {
  /**
   * Think before you act.
   *
   * Before completing the extraction, reflect on:
   *
   * - Which SRS categories are relevant to this file's content?
   * - Have you mapped all traceable items to valid sectionIds?
   * - Have you included only categories that have substantive content?
   */
  thinking?: string | null;

  /** Extraction result. */
  request: IAutoBeAnalyzeDocumentApplicationComplete;
}

/** Request to complete the SRS extraction. */
export interface IAutoBeAnalyzeDocumentApplicationComplete {
  /** Type discriminator for the request. */
  type: "complete";

  /**
   * The extracted SRS data.
   *
   * Only populate categories that are relevant to this file's content. The
   * `selectedCategories` array must list exactly the categories that have data
   * populated.
   *
   * Every traceable item (those with `sourceSectionIds`) must reference at
   * least one valid sectionId from the Evidence Layer provided in the context.
   */
  srs: AutoBeAnalyzeDocumentSrs;
}
