import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";

/** Generates unit-level sections (##) within approved module structures. */
export interface IAutoBeAnalyzeWriteUnitApplication {
  /**
   * Create unit sections with titles, purposes, content, and keywords for a
   * module.
   */
  process(props: IAutoBeAnalyzeWriteUnitApplicationProps): void;
}

export interface IAutoBeAnalyzeWriteUnitApplicationProps {
  /**
   * Reasoning about your current state: what's missing (preliminary) or what
   * you accomplished (completion).
   */
  thinking?: string | null;

  /** Action to perform. Exhausted preliminary types are removed from the union. */
  request:
    | IAutoBeAnalyzeWriteUnitApplicationComplete
    | IAutoBePreliminaryGetPreviousAnalysisSections;
}

/** Generate unit section structure within a module section. */
export interface IAutoBeAnalyzeWriteUnitApplicationComplete {
  /** Type discriminator for completion request. */
  type: "complete";

  /** Index of the parent module section (0-based). */
  moduleIndex: number;

  /** Unit sections (### level) grouping related functionality. */
  unitSections: IAutoBeAnalyzeWriteUnitApplicationUnitSection[];
}

/** A single unit section. */
export interface IAutoBeAnalyzeWriteUnitApplicationUnitSection {
  /** Title of the unit section (### level heading). */
  title: string;

  /** Brief purpose statement for this section's role within the parent module. */
  purpose: string;

  /** Main body content: overview, context, and relationships to other sections. */
  content: string;

  /** Keywords hinting at section topics to guide Section Agent generation. */
  keywords: string[];
}
