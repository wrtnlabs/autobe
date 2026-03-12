/**
 * A single ### section extracted from an analysis file, enriched with parent
 * hierarchy context and numeric ID for LLM-friendly retrieval.
 *
 * Instead of loading entire analysis files (~110-120KB each), the preliminary
 * system can load individual sections (~200-600 words) identified by sequential
 * integer IDs.
 *
 * @author Juntak
 */
export interface IAnalysisSectionEntry {
  /**
   * Sequential integer ID (0, 1, 2, ...). The LLM requests sections by these
   * IDs.
   */
  id: number;

  /** Source filename, e.g. "01-service-overview.md" */
  filename: string;

  /** Module title (# level parent) */
  moduleTitle: string;

  /** Unit title (## level parent) */
  unitTitle: string;

  /** Section title (### level) */
  sectionTitle: string;

  /** Keywords from the parent AutoBeAnalyze.IUnit */
  keywords: string[];

  /** The actual ### section content (~200-600 words) */
  content: string;
}
