/**
 * Logical grouping of API endpoints based on Prisma schema structure.
 *
 * Groups divide large API specifications into manageable generation cycles,
 * maintaining alignment between API structure and database schema.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceGroup {
  /**
   * Group name derived from Prisma schema structure (PascalCase).
   *
   * Priority: 1) namespace names, 2) schema file names, 3) table prefix
   * patterns. Examples: "Shopping", "BBS", "UserManagement".
   */
  name: string;

  /**
   * Scope and purpose of this group. Include: schema foundation
   * (namespace/file/prefix), specific table names covered, functional
   * operations, and entity relationships. 100-2000 characters.
   */
  description: string;

  /**
   * Prisma model names needed for this group's endpoints.
   *
   * Include ALL models users interact with, related CRUD models, parent/child
   * models, and snapshot models. Exclude system-internal, cache, and framework
   * tables. Be thorough — include extra rather than miss required ones.
   */
  databaseSchemas: string[];
}
