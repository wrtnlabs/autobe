/**
 * Single validation result entry.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentValidationResult {
  /**
   * Severity.
   *
   * - `fail`: blocks downstream (e.g., missing sourceSectionIds, missing required
   *   category)
   * - `warn`: quality signal (e.g., empty useCase, unused glossary term)
   */
  severity: "fail" | "warn";

  /** Validation category (e.g., "traceability", "completeness", "consistency") */
  category: string;

  /** Validation result message */
  message: string;

  /** Related section IDs (if applicable) */
  sectionIds?: string[];
}

/**
 * Structural completeness validation result of the Analyze artifact.
 *
 * A separate result type decoupled from the document data model.
 *
 * - `fail`: blocks downstream progression (required invariant violation)
 * - `warn`: quality signal (improvable but can proceed)
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentValidation {
  /** Validation result list */
  results: Array<AutoBeAnalyzeDocumentValidationResult>;

  /**
   * Overall validity.
   *
   * `true` when there are zero `fail` results. If `false`, downstream
   * progression should be blocked.
   */
  isValid: boolean;
}
