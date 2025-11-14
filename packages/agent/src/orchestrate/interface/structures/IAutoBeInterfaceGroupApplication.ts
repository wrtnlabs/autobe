import { AutoBeInterfaceGroup } from "@autobe/interface/src/histories/contents/AutoBeInterfaceGroup";
import { tags } from "typia";

export interface IAutoBeInterfaceGroupApplication {
  /**
   * Generate logical groups for organizing API endpoint creation based on
   * Prisma schema structure.
   *
   * DO: Derive groups from Prisma schema organization (namespaces, file
   * structure, table prefixes) rather than arbitrary business domains. DO:
   * Create new groups only when existing schema structure cannot adequately
   * cover all requirements.
   *
   * @param props Properties containing the groups to be created for API
   *   organization
   */
  makeGroups(props: IAutoBeInterfaceGroupApplication.IProps): void;
}

export namespace IAutoBeInterfaceGroupApplication {
  export interface IProps {
    /**
     * Array of API endpoint groups for organizing development.
     *
     * DO: Organize groups around existing Prisma schema structure. DO: Provide
     * complete coverage of all entities and requirements without overlap.
     */
    groups: AutoBeInterfaceGroup[] & tags.MinItems<1>;
  }
}
