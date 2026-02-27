import { AutoBeAnalyzeDocumentSection } from "./AutoBeAnalyzeDocumentSection";
import { AutoBeAnalyzeDocumentSrs } from "./AutoBeAnalyzeDocumentSrs";
import { AutoBeAnalyzeDocumentValidation } from "./AutoBeAnalyzeDocumentValidation";

/**
 * Single final artifact of the Analyze Phase (Two-Layer structure).
 *
 * Downstream phases (Database/Interface/Test/Realize) receive this structure as
 * input and **consume it directly without document parsing**.
 *
 * ## Two-Layer Structure
 *
 * - **Evidence Layer** (`sections`): "Where did this requirement come from?"
 *
 *   - Atomic evidence units decomposed from source markdown at H1-H3 level
 *   - All SRS items reference `sectionId` via `sourceSectionIds`
 * - **Semantic Layer** (`srs`): "What should the system do?"
 *
 *   - Based on ISO/IEC/IEEE 29148 + extension categories
 *   - Dynamically selected by LLM based on project characteristics
 *
 * The two layers are strongly linked via `sourceSectionIds`.
 *
 * **Key invariant**: Every traceable entry must have at least one
 * `sourceSectionIds`.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocument {
  /**
   * Evidence Layer: source section list.
   *
   * Evidence data decomposed from source markdown at H1-H3 level. All Semantic
   * Layer items reference `sectionId` from these sections.
   */
  sections: AutoBeAnalyzeDocumentSection[];

  /**
   * Semantic Layer: structured SRS data.
   *
   * A set of categories dynamically selected by the LLM based on project
   * characteristics, from 6 standard ISO/IEC/IEEE 29148 sections + 4 extension
   * categories.
   */
  srs: AutoBeAnalyzeDocumentSrs;

  /**
   * Structural completeness validation result.
   *
   * If `isValid` is `false`, downstream progression should be blocked.
   */
  validation: AutoBeAnalyzeDocumentValidation;
}
