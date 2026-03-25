import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";

/**
 * Generates detailed sections (###) within approved unit structures as
 * implementation-ready specs.
 */
export interface IAutoBeAnalyzeWriteSectionApplication {
  /**
   * Create detailed sections for a unit, with Mermaid diagrams and EARS format
   * where applicable.
   */
  process(props: IAutoBeAnalyzeWriteSectionApplicationProps): void;
}

export interface IAutoBeAnalyzeWriteSectionApplicationProps {
  /**
   * Reasoning about your current state: what's missing (preliminary) or what
   * you accomplished (completion).
   */
  thinking?: string | null;

  /** Action to perform. Exhausted preliminary types are removed from the union. */
  request:
    | IAutoBeAnalyzeWriteSectionApplicationComplete
    | IAutoBePreliminaryGetPreviousAnalysisSections;
}

/** Generate detailed section content within a unit section. */
export interface IAutoBeAnalyzeWriteSectionApplicationComplete {
  /** Type discriminator for completion request. */
  type: "complete";

  /** Index of the grandparent module section. */
  moduleIndex: number;

  /** Index of the parent unit section. */
  unitIndex: number;

  /** Detailed subsections (#### level) for this unit. */
  sectionSections: IAutoBeAnalyzeWriteSectionApplicationSectionSection[];
}

/** A single section (#### level). */
export interface IAutoBeAnalyzeWriteSectionApplicationSectionSection {
  /** Section title (#### level heading). */
  title: string;

  /**
   * Complete section content with requirements, specs, and diagrams.
   *
   * EARS Format (03-functional-requirements, 04-business-rules ONLY):
   *
   * - Ubiquitous: "THE <system> SHALL <function>"
   * - Event-driven: "WHEN <trigger>, THE <system> SHALL <function>"
   * - State-driven: "WHILE <state>, THE <system> SHALL <function>"
   * - Unwanted: "IF <condition>, THEN THE <system> SHALL <function>"
   * - Optional: "WHERE <feature>, THE <system> SHALL <function>"
   *
   * Other files (00-toc, 01, 02, 05): clear descriptive prose, tables, bullet
   * points.
   *
   * Mermaid rules: ALL labels use double quotes A["Label"], no spaces before
   * quotes, --> arrows, LR preferred.
   *
   * NEVER include: DB schemas/ERD, API specs, implementation details, frontend
   * UI/UX specs. Every requirement MUST trace to user input. Do NOT invent SLA
   * numbers, timeouts, security mechanisms, or infrastructure the user did not
   * mention. One concept = one section. 02-domain-model: max 1-3 sections per
   * concept.
   */
  content: string;
}
