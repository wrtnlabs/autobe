/**
 * Atomic unit of the Evidence Layer.
 *
 * Evidence data decomposed from source markdown at H1-H3 level. All Semantic
 * Layer items reference this `sectionId` via `sourceSectionIds` to guarantee
 * source traceability.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentSection {
  /**
   * Unique identifier.
   *
   * Format: `"{fileIndex}-{moduleIndex}-{unitIndex}-{sectionIndex}"`
   *
   * - Level 1 (Module): `"0-2"` (fileIndex=0, moduleIndex=2)
   * - Level 2 (Unit): `"0-2-1"` (fileIndex=0, moduleIndex=2, unitIndex=1)
   * - Level 3 (Section): `"0-2-1-3"` (fileIndex=0, moduleIndex=2, unitIndex=1,
   *   sectionIndex=3)
   */
  sectionId: string;

  /** Markdown heading level. 1=#(Module), 2=##(Unit), 3=###(Section) */
  level: 1 | 2 | 3;

  /** Section heading */
  heading: string;

  /** Section body content */
  content: string;

  /** Parent section ID. null for level 1 */
  parentSectionId: string | null;
}
