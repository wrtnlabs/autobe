export interface IAutoBeImageDescribeDraftApplication {
  /**
   * Analyze an image through observation, interpretation, and documentation
   * phases.
   */
  analyzeImage: (props: IAutoBeImageDescribeDraftApplication.IProps) => void;
}

export namespace IAutoBeImageDescribeDraftApplication {
  export interface IProps {
    /**
     * Step 1: Raw observation of all visible elements (objects, text, UI,
     * layout) without interpretation.
     */
    observation: string;

    /**
     * Step 2: Interpret observed elements — purpose, relationships, workflows,
     * domain context.
     */
    analysis: string;

    /**
     * Step 3: 3-5 main topics/themes in kebab-case (e.g., "user-dashboard",
     * "payment-flow").
     */
    topics: string[];

    /**
     * Step 4: Concise 2-3 sentence summary capturing what the image shows and
     * its purpose.
     */
    summary: string;

    /**
     * Step 5: Comprehensive markdown description enabling understanding without
     * seeing the image.
     */
    description: string;
  }
}
