export interface IAutoBeImageDescribeDraftApplication {
  /**
   * Analyzes UI/UX images to generate backend development planning drafts.
   *
   * Processes screenshots, mockups, or wireframes to extract entities, APIs,
   * business logic, and workflows for backend implementation.
   */
  analyzeImage: (next: IAutoBeImageDescribeDraftApplication.IProps) => void;
}

export namespace IAutoBeImageDescribeDraftApplication {
  export interface IProps {
    /**
     * Structured metadata for organizing and clustering related screens. Used
     * to group similar functionality and improve document organization.
     */
    metadata: IMetadata;

    /**
     * Comprehensive planning document in markdown format containing:
     *
     * - Overview of analyzed screens and their purpose
     * - Identified data entities with relationships
     * - Required API endpoints with operations
     * - Business logic rules and validation requirements
     * - User roles, permissions, and authentication flows
     * - Workflow descriptions for multi-step processes
     */
    draft: string;
  }

  export interface IMetadata {
    /**
     * Brief 1-2 sentence description summarizing what the analyzed screens
     * represent and their main functionality in the system.
     */
    summary: string;
    /**
     * Array of 3-5 key feature tags identifying the functional areas (e.g.,
     * ["user-management", "authentication", "profile-settings"]). Used for
     * categorizing and finding related screens.
     */
    topics: string[];
    /**
     * Single descriptive identifier for grouping related screens into
     * functional clusters (e.g., "user-auth-flow", "order-management"). Enables
     * efficient organization of multi-screen workflows.
     */
    clusterKey: string;
  }
}
