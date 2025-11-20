export interface IAutoBeImageDescribeDraftsIntegrationsApplication {
  /**
   * Integrates multiple drafts from a group into a single coherent section.
   *
   * Analyzes all drafts within a group to produce a consolidated specification
   * document that removes duplicates, resolves conflicts, and creates a
   * comprehensive section for one functional area of the system.
   */
  integrateDrafts: (
    next: IAutoBeImageDescribeDraftsIntegrationsApplication.IProps,
  ) => void;
}

export namespace IAutoBeImageDescribeDraftsIntegrationsApplication {
  export interface IProps {
    /**
     * The cluster key for this integrated section.
     *
     * Identifies the functional area being integrated.
     */
    clusterKey: string;

    /**
     * The integrated section document in English.
     *
     * A comprehensive specification section following the B2B SaaS requirements
     * document format, consolidating all drafts from the group into one
     * coherent document.
     */
    integration: string;
  }
}
