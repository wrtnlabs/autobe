import { tags } from "typia";

import { AutoBeAnalyzeDocumentSection } from "./AutoBeAnalyzeDocumentSection";
import { AutoBeAnalyzeDocumentSrs } from "./AutoBeAnalyzeDocumentSrs";

/**
 * Root interface for the Analyze Phase structured output.
 *
 * `AutoBeAnalyzeDocument` is the single deliverable produced by the
 * Analyze Agent. It carries both the raw section assets (original text
 * chunked by heading) and a semantically typed SRS layer that downstream
 * phases (Database / Interface / Test / Realize) can consume without
 * re-parsing.
 *
 * The document is composed of two layers:
 *
 * 1. **Evidence Layer** (`sections`) — markdown chunks preserving the
 *    original document order and heading hierarchy.
 * 2. **Semantic Layer** (`srs`) — ISO/IEC/IEEE 29148-based structured
 *    requirements data.
 *
 * These two layers are connected via `sourceSectionIds`: every traceable
 * entry in the SRS layer MUST reference at least one section. This makes
 * every spec statement traceable to the original evidence.
 *
 * Field names and traceability constraints are treated as a **long-term
 * compatibility contract** because the same structure may be used as a
 * prompt output schema, benchmark fixture, or log format.
 *
 * Validation is performed separately and produces an
 * {@link AutoBeAnalyzeDocumentValidation} result. The validation type is
 * intentionally not embedded in this document to keep the data model clean.
 *
 * @author juntak
 */
export interface AutoBeAnalyzeDocument {
  /**
   * Unique identifier for this document snapshot.
   *
   * Must be stable across serialization round-trips.
   * Recommended: UUID v7 for time-sortability.
   */
  documentId: string & tags.MinLength<1>;

  /**
   * Schema version of the `AutoBeAnalyzeDocument` structure itself
   * (major.minor.patch).
   *
   * This version describes the **type layout** (which fields exist, their
   * semantics, and validation rules), NOT the content snapshot of a
   * particular document. All documents produced under the same schema
   * version are structurally compatible, so downstream consumers can use
   * this value to decide whether their parser/validator is up-to-date.
   *
   * Bump rules:
   *
   * - major: breaking field removal or type change
   * - minor: new optional field or new enum variant
   * - patch: JSDoc / validation-rule refinement only
   */
  version: string;

  /**
   * Ordered array of section assets extracted from the markdown source.
   *
   * Each section corresponds to one heading (H1–H3) and contains the raw
   * text, a short summary, keywords for retrieval, and positional
   * metadata. This is the "evidence layer" that SRS entries reference.
   */
  sections: AutoBeAnalyzeDocumentSection[] & tags.MinItems<1>;

  /**
   * Semantically typed SRS structure.
   *
   * Follows a simplified ISO/IEC/IEEE 29148:2018 Analyst View with
   * exactly 6 top-level sections. Every requirement item links back to
   * {@link sections} via `sourceSectionIds`.
   */
  srs: AutoBeAnalyzeDocumentSrs;
}
