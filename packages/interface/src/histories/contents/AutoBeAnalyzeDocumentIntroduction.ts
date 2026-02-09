import { tags } from "typia";

/**
 * SRS Section 1 — Introduction.
 *
 * Captures the purpose, scope, audience, domain glossary, and external
 * references of the system being specified. This section corresponds to
 * the "Introduction" clause of ISO/IEC/IEEE 29148:2018.
 *
 * All downstream phases can use the glossary entries to ensure consistent
 * terminology and the scope statement to determine what is explicitly
 * included or excluded from the system boundary.
 *
 * @author juntak
 */
export interface AutoBeAnalyzeDocumentIntroduction {
  /**
   * One-sentence purpose statement describing why this system exists.
   */
  purpose: string;

  /**
   * System scope: what is included and what is explicitly excluded.
   */
  scope: string;

  /**
   * Target audience and reading guide for the document.
   */
  audience: string;

  /**
   * Domain-specific terms and their definitions.
   *
   * An empty glossary will trigger an `EMPTY_GLOSSARY` WARN during
   * validation.
   */
  glossary: AutoBeAnalyzeDocumentIntroduction.GlossaryEntry[];

  /**
   * External documents, standards, or resources referenced by this spec.
   */
  references: AutoBeAnalyzeDocumentIntroduction.Reference[];

  /**
   * Traceability link back to the evidence layer.
   *
   * MUST contain at least one sectionId. Validated as FAIL
   * (`EMPTY_SOURCE_SECTION_IDS`) if empty.
   */
  sourceSectionIds: string[] & tags.MinItems<1>;
}
export namespace AutoBeAnalyzeDocumentIntroduction {
  /**
   * A glossary entry defining a domain-specific term.
   */
  export interface GlossaryEntry {
    /**
     * The term being defined.
     */
    term: string & tags.MinLength<1>;

    /**
     * Plain-language definition.
     */
    definition: string;
  }

  /**
   * A reference to an external document, standard, or resource.
   */
  export interface Reference {
    /**
     * Short label or title of the referenced material.
     */
    title: string;

    /**
     * URL, DOI, or document identifier.
     */
    url?: string & tags.Format<"uri">;

    /**
     * Free-form description of relevance.
     */
    description?: string;
  }
}
