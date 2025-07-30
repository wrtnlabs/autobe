import { tags } from "typia";

export interface IAutoBeInterfaceGroupApplication {
  /**
   * Generate logical groups for organizing API endpoint creation based on
   * Prisma schema structure.
   *
   * Groups MUST be derived from Prisma schema organization (namespaces, file
   * structure, table prefixes) rather than arbitrary business domains. Only
   * create new groups when existing schema structure cannot adequately cover
   * all requirements.
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
     * Groups MUST be organized around existing Prisma schema structure and
     * provide complete coverage of all entities and requirements without
     * overlap.
     */
    groups: IGroup[] & tags.MinItems<1>;
  }

  /**
   * Definition of a logical API endpoint group based on Prisma schema
   * organization.
   *
   * **SCHEMA-BASED GROUP REQUIREMENTS:**
   *
   * Groups MUST be derived from the Prisma schema structure rather than
   * arbitrary business domain names. This ensures consistency with the
   * underlying data model and prevents misalignment between API organization
   * and database structure.
   *
   * **Primary Group Sources (in order of priority):**
   *
   * 1. **Prisma Schema Namespaces**: Use namespace names (e.g., `namespace
   *    Shopping` → "Shopping")
   * 2. **Schema File Names**: Derive from file names (e.g., `shopping.prisma` →
   *    "Shopping")
   * 3. **Table Prefix Patterns**: Use consistent prefixes (e.g., `shopping_orders`
   *    → "Shopping")
   * 4. **Schema Comments/Annotations**: Follow organizational comments in schema
   *
   * **Group Creation Guidelines:**
   *
   * - Each group must cover specific Prisma schema entities without overlap
   * - Size groups appropriately for manageable endpoint generation cycles
   * - Maintain clear boundaries based on schema organization
   * - Ensure complete coverage of all database entities and requirements
   * - Related database tables within the same schema area should be grouped
   *   together
   *
   * **When to Create Schema-Independent Groups:**
   *
   * Only create groups that don't correspond to Prisma schema organization
   * when:
   *
   * - Requirements include functionality not represented in any schema entity
   * - Cross-cutting concerns span multiple schema areas
   * - Integration operations don't map to specific database entities
   * - System-level functionality requires dedicated API operations
   *
   * **Naming Standards:**
   *
   * - Use PascalCase format (e.g., "Shopping", "BBS", "UserManagement")
   * - Names MUST directly reflect Prisma schema structure
   * - Keep names concise and schema-derived
   * - Avoid arbitrary business domain names
   * - Maintain consistency with schema organization
   *
   * **Quality Requirements:**
   *
   * - Groups collectively must cover ALL entities and requirements
   * - Each database entity belongs to exactly one group
   * - Clear mapping to specific Prisma schema elements
   * - Balance group sizes within schema constraints
   * - Follow existing schema namespace or file structure patterns
   */
  export interface IGroup {
    /**
     * Unique identifier name derived from Prisma schema structure.
     *
     * Must correspond to schema namespaces, file names, table prefixes, or
     * organizational annotations rather than arbitrary business domain names.
     */
    name: string & tags.MinLength<1>;

    /**
     * Comprehensive description of the group's scope, schema foundation, and
     * purpose.
     *
     * **Required Content:**
     *
     * 1. Schema Foundation: Identify the Prisma schema elements defining this
     *    group
     * 2. Database Entities: List specific tables and entities from the schema
     * 3. Functional Scope: Detail operations and workflows for schema entities
     * 4. Schema Relationships: Describe table relationships and dependencies
     * 5. Key Operations: Outline main operation types (CRUD, business processes)
     * 6. Requirements Mapping: Explain how requirements map to schema entities
     */
    description: string & tags.MinLength<1>;
  }
}
