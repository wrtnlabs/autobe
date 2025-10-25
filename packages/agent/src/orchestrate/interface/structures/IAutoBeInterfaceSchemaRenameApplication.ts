import { AutoBeInterfaceSchemaRefactor } from "@autobe/interface";

export interface IAutoBeInterfaceSchemaRenameApplication {
  /**
   * Analyze DTO type names and identify naming violations.
   *
   * This method examines existing DTO type names to detect violations of the
   * CRITICAL naming rule: ALL words from the Prisma table name MUST be
   * preserved in the DTO type name. Omitting intermediate words breaks
   * type-to-table traceability and causes system failures.
   *
   * The method receives a list of Prisma table names and current DTO type
   * names, then identifies which type names incorrectly omit service prefixes
   * or intermediate components from their corresponding table names.
   *
   * @param props Properties containing refactoring operations to fix naming
   *   violations.
   */
  rename(props: IAutoBeInterfaceSchemaRenameApplication.IProps): void;
}
export namespace IAutoBeInterfaceSchemaRenameApplication {
  export interface IProps {
    /**
     * List of refactoring operations to rename incorrectly named DTO types.
     *
     * Each refactor specifies:
     *
     * - `from`: The current INCORRECT type name (e.g., "ISale", "IBbsComment")
     * - `to`: The CORRECT type name with all components preserved (e.g.,
     *   "IShoppingSale", "IBbsArticleComment")
     *
     * IMPORTANT: Only include type names that violate the naming rules. If a
     * type name correctly preserves all components from the table name, do NOT
     * include it in the refactors list.
     *
     * The orchestrator will automatically handle:
     *
     * - Renaming the base type (e.g., ISale → IShoppingSale)
     * - Renaming all variants (e.g., ISale.ICreate → IShoppingSale.ICreate)
     * - Renaming page types (e.g., IPageISale → IPageIShoppingSale)
     * - Updating all $ref references throughout the OpenAPI document
     */
    refactors: AutoBeInterfaceSchemaRefactor[];
  }
}
