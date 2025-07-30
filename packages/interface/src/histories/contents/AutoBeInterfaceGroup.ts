/**
 * Interface representing a logical grouping of API endpoints based on Prisma
 * schema structure.
 *
 * This interface defines organizational units used by the Interface agent to
 * manage API endpoint generation for large-scale projects. Each group
 * represents a cohesive collection of database entities and their associated
 * API operations, derived directly from the Prisma schema organization rather
 * than arbitrary business domains.
 *
 * Groups serve as the foundational organizing principle for:
 *
 * - Dividing large API specifications into manageable generation cycles
 * - Maintaining alignment between API structure and database schema
 * - Ensuring complete coverage of all database entities
 * - Facilitating modular and scalable API development
 *
 * The group structure must strictly follow Prisma schema organization patterns
 * such as namespaces, file boundaries, or table prefix conventions to ensure
 * consistency between the data model and API design.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceGroup {
  /**
   * Name identifier for the API endpoint group.
   *
   * This name must be derived from the Prisma schema structure following these
   * priorities:
   *
   * 1. Prisma namespace names (e.g., `namespace Shopping` → "Shopping")
   * 2. Schema file names (e.g., `shopping.prisma` → "Shopping")
   * 3. Table prefix patterns (e.g., `shopping_*` tables → "Shopping")
   *
   * Names should use PascalCase format and range from 3-50 characters.
   * Examples: "Shopping", "BBS", "UserManagement", "PaymentProcessing"
   */
  name: string;

  /**
   * Comprehensive description of the API endpoint group's scope and purpose.
   *
   * The description must include:
   *
   * - Schema foundation (namespace, file, or prefix pattern)
   * - Specific database entities (table names) covered by this group
   * - Functional operations and workflows supported
   * - Relationships between entities within the group
   * - How requirements map to these schema entities
   *
   * Descriptions should be 100-2000 characters and focus on concrete schema
   * elements rather than abstract business concepts.
   */
  description: string;
}
