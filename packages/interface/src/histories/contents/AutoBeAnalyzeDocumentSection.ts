import { tags } from "typia";

/**
 * A single section extracted from the Analyze markdown output.
 *
 * Sections are the atomic unit of evidence in the Evidence Layer. They are
 * produced by splitting the original requirements markdown document along
 * H1–H3 headings so that every downstream SRS entry can reference exactly
 * which part of the source text it was derived from.
 *
 * Each section is identified by a stable {@link sectionId} and ordered by
 * {@link orderKey} so that downstream consumers can reconstruct the original
 * reading order without access to the source file.
 *
 * This type, together with the `sourceSectionIds` fields found throughout
 * the SRS layer, forms the traceability backbone of
 * {@link AutoBeAnalyzeDocument}. Field names and traceability constraints
 * are treated as a long-term compatibility contract because the same
 * structure may be used as a prompt output schema, benchmark fixture, or
 * log format.
 *
 * @author juntak
 */
export interface AutoBeAnalyzeDocumentSection {
  /**
   * Stable, globally-unique section identifier.
   *
   * This ID is referenced by every `sourceSectionIds` field in the SRS
   * layer. It must remain constant across serialization round-trips.
   *
   * Recommended format: `${documentId}:${orderKey}:${normalizedTitle}`
   */
  sectionId: string & tags.MinLength<1>;

  /**
   * Hierarchical title path from the document root to this section.
   *
   * Each element corresponds to one heading level, preserving the nesting
   * context without requiring the full content of ancestor sections.
   *
   * @example ["1. Service Overview", "1.2 Authentication", "1.2.1 OAuth"]
   */
  titlePath: string[];

  /**
   * Lexicographically-sortable key that encodes document order.
   *
   * Downstream consumers can sort sections by this key to restore the
   * original reading order of the source document.
   *
   * @example "001.002.001"
   */
  orderKey: string & tags.MinLength<1>;

  /**
   * Heading level of this section.
   *
   * - 1 = H1 (대단원)
   * - 2 = H2 (중단원)
   * - 3 = H3 (소단원)
   */
  level: 1 | 2 | 3;

  /**
   * Full markdown content of this section, including the heading line.
   *
   * This is the raw evidence text. SRS entries reference this content via
   * `sourceSectionIds` to maintain traceability.
   */
  content: string;

  /**
   * AI-generated summary of this section (2–3 sentences).
   *
   * Used for context retrieval and evidence chain assembly without loading
   * the full {@link content}.
   */
  summary: string;

  /**
   * Keywords extracted from this section for search and retrieval.
   *
   * 3–7 domain-relevant terms recommended. Sections with fewer than 3
   * keywords will trigger an `INSUFFICIENT_KEYWORDS` WARN during
   * validation.
   */
  keywords: string[] & tags.MinItems<1>;

  /**
   * Provenance information linking this section back to the source file.
   */
  source: AutoBeAnalyzeDocumentSection.Source;
}
export namespace AutoBeAnalyzeDocumentSection {
  /**
   * Source provenance for a section.
   *
   * Records which file and line range the section was extracted from,
   * enabling precise back-navigation to the original document.
   */
  export interface Source {
    /**
     * Relative path of the markdown file this section was extracted from.
     *
     * @example "03-functional-requirements.md"
     */
    filePath: string;

    /**
     * Starting line number in the source file (0-based, inclusive).
     *
     * Omitted when the section was synthesized during review or amendment.
     */
    startLine?: number;

    /**
     * Ending line number in the source file (0-based, exclusive).
     */
    endLine?: number;
  }
}
