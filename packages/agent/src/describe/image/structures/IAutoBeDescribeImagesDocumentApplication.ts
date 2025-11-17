export interface IAutoBeDescribeImagesDocumentApplication {
  /**
   * Combines all integrated sections into a complete requirements document.
   *
   * Takes all the integrated sections from different functional areas and
   * assembles them into a comprehensive B2B SaaS requirements document with
   * proper structure, table of contents, and executive summary.
   */
  completeDocument: (
    next: IAutoBeDescribeImagesDocumentApplication.IProps,
  ) => void;
}

export namespace IAutoBeDescribeImagesDocumentApplication {
  export interface IProps {
    /**
     * Executive summary of the entire system.
     *
     * A high-level overview that captures the essence of the system, its key
     * features, and architectural considerations.
     */
    summary: string;

    /**
     * The complete requirements document in English.
     *
     * A professionally formatted B2B SaaS requirements specification that
     * combines all functional areas into one cohesive document, ready to be
     * used as input for backend application development.
     */
    document: string;

    /**
     * List of major sections in the document.
     *
     * Provides a quick reference to all functional areas covered, helping
     * readers navigate the document efficiently.
     */
    sections: string[];
  }
}
