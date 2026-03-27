import { AutoBeInterfaceSchemaRefactor } from "@autobe/interface";

export interface IAutoBeInterfaceSchemaRenameApplication {
  /**
   * Identify DTO type names that violate the naming rule: ALL words from the
   * database table name MUST be preserved in the DTO type name.
   */
  rename(props: IAutoBeInterfaceSchemaRenameApplication.IProps): void;
}
export namespace IAutoBeInterfaceSchemaRenameApplication {
  export interface IProps {
    /**
     * Refactoring operations for incorrectly named DTO types. Only include
     * violations. Orchestrator auto-handles variants, page types, and $ref
     * updates.
     */
    refactors: AutoBeInterfaceSchemaRefactor[];
  }
}
