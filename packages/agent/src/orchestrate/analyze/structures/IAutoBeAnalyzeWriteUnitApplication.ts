import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";

/** Generates unit-level sections (##) within approved module structures. */
export interface IAutoBeAnalyzeWriteUnitApplication {
  /**
   * Create unit sections with titles, purposes, content, and keywords for a
   * module.
   */
  process(props: IAutoBeAnalyzeWriteUnitApplication.IProps): void;
}
export namespace IAutoBeAnalyzeWriteUnitApplication {
  export interface IProps {
    /**
     * Reasoning: what's missing (preliminary), what you're submitting (write),
     * or why you're finalizing (complete).
     */
    thinking?: string | null;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union.
     */
    request:
      | IAutoBeAnalyzeWriteUnitApplication.IWrite
      | IAutoBePreliminaryComplete
      | IAutoBePreliminaryGetPreviousAnalysisSections;
  }

  /** Submit unit section structure within a module section. */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

    /** Index of the parent module section (0-based). */
    moduleIndex: number;

    /** Unit sections (### level) grouping related functionality. */
    unitSections: ISection[];
  }

  /** A single unit section. */
  export interface ISection {
    /** Title of the unit section (### level heading). */
    title: string;

    /** Brief purpose statement for this section's role within the parent module. */
    purpose: string;

    /**
     * Main body content: overview, context, and relationships to other
     * sections.
     */
    content: string;

    /** Keywords hinting at section topics to guide Section Agent generation. */
    keywords: string[];
  }
}
