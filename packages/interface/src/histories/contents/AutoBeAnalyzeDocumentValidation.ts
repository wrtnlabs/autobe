/**
 * Result of validating an {@link AutoBeAnalyzeDocument}.
 *
 * Validation is split into two severity levels:
 *
 * - **FAIL**: Blocks downstream consumption. The document MUST be
 *   regenerated or repaired before it can be used.
 * - **WARN**: Advisory. Does not block downstream but indicates quality
 *   degradation that should be addressed.
 *
 * This type is not embedded in the document itself; it is produced as a
 * separate validation result so that the document data model stays clean.
 *
 * @author juntak
 */
export interface AutoBeAnalyzeDocumentValidation {
  /**
   * Overall pass/fail status.
   *
   * `false` if any FAIL-level issue exists.
   */
  valid: boolean;

  /**
   * Issues that block downstream consumption.
   *
   * The document MUST be regenerated or repaired before it can be used.
   */
  failures: AutoBeAnalyzeDocumentValidation.Issue[];

  /**
   * Advisory issues that do not block downstream but indicate quality
   * degradation.
   */
  warnings: AutoBeAnalyzeDocumentValidation.Issue[];
}
export namespace AutoBeAnalyzeDocumentValidation {
  /**
   * A single validation issue.
   */
  export interface Issue {
    /**
     * Machine-readable rule code.
     */
    rule: FailRule | WarnRule;

    /**
     * Human-readable explanation.
     */
    message: string;

    /**
     * JSONPath or identifier pointing to the offending element.
     *
     * @example "$.srs.systemCapabilitiesAndFunctionalRequirements.functionalRequirements[2].sourceSectionIds"
     */
    path?: string;
  }

  /**
   * FAIL-level rules. Any match means the document is invalid.
   *
   * - `MISSING_DOCUMENT_ID`: documentId is empty or missing.
   * - `MISSING_VERSION`: version is empty or missing.
   * - `DUPLICATE_SECTION_ID`: Two or more sections share the same
   *   sectionId.
   * - `EMPTY_SOURCE_SECTION_IDS`: Any SRS section or traceable entry has
   *   an empty sourceSectionIds array, breaking traceability.
   * - `DANGLING_SOURCE_SECTION_ID`: A sourceSectionIds entry references a
   *   sectionId that does not exist in sections.
   * - `DUPLICATE_REQUIREMENT_ID`: Two or more entries share the same
   *   requirementId, capabilityId, useCaseId, ruleId, interfaceId,
   *   constraintId, or scenarioId.
   * - `MISSING_CONTEXT_DIAGRAM_SYSTEM`: The contextDiagram has no node
   *   with type "system".
   * - `DANGLING_CONTEXT_EDGE`: A context diagram edge references a nodeId
   *   that does not exist.
   * - `DANGLING_RELATED_ID`: A relatedCapabilityIds or relatedUseCaseIds
   *   entry references an ID that does not exist.
   * - `MISSING_PERFORMANCE_METRIC`: A performance requirement has an
   *   empty or missing metric field.
   */
  export type FailRule =
    | "MISSING_DOCUMENT_ID"
    | "MISSING_VERSION"
    | "DUPLICATE_SECTION_ID"
    | "EMPTY_SOURCE_SECTION_IDS"
    | "DANGLING_SOURCE_SECTION_ID"
    | "DUPLICATE_REQUIREMENT_ID"
    | "MISSING_CONTEXT_DIAGRAM_SYSTEM"
    | "DANGLING_CONTEXT_EDGE"
    | "DANGLING_RELATED_ID"
    | "MISSING_PERFORMANCE_METRIC";

  /**
   * WARN-level rules. Advisory only.
   *
   * - `MISSING_SUMMARY_EXCESSIVE`: More than 30% of sections lack a
   *   summary.
   * - `MISSING_KEYWORDS_EXCESSIVE`: More than 30% of sections have no
   *   keywords.
   * - `INSUFFICIENT_KEYWORDS`: One or more sections have fewer than 3
   *   keywords.
   * - `LOW_SECTION_COUNT`: Document has fewer than 3 sections.
   * - `EMPTY_GLOSSARY`: Introduction has no glossary entries.
   * - `NO_CAPABILITIES`: Section 4 has no capabilities defined.
   * - `NO_USE_CASES`: Section 4 has no use cases defined.
   * - `ORPHAN_FUNCTIONAL_REQUIREMENT`: A functional requirement has no
   *   relatedCapabilityIds and no relatedUseCaseIds.
   * - `EMPTY_QAS_LIST`: Section 6 has no quality attribute scenarios.
   */
  export type WarnRule =
    | "MISSING_SUMMARY_EXCESSIVE"
    | "MISSING_KEYWORDS_EXCESSIVE"
    | "INSUFFICIENT_KEYWORDS"
    | "LOW_SECTION_COUNT"
    | "EMPTY_GLOSSARY"
    | "NO_CAPABILITIES"
    | "NO_USE_CASES"
    | "ORPHAN_FUNCTIONAL_REQUIREMENT"
    | "EMPTY_QAS_LIST";
}
