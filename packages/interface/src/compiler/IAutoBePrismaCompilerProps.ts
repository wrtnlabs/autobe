/**
 * Configuration properties for Prisma schema compilation operations.
 *
 * This interface defines the input parameters required for compiling Prisma
 * schema files into complete database artifacts including documentation, ERD
 * diagrams, and dependency files. The properties specify the schema files that
 * have been generated from validated {@link AutoBePrisma.IApplication} AST
 * structures and are ready for final compilation processing.
 *
 * The compilation process transforms these schema files into production-ready
 * database artifacts through the embedded Prisma compiler, ensuring
 * compatibility with the target database environment and generating all
 * supporting documentation and visualization materials.
 *
 * @author Samchon
 */
export interface IAutoBePrismaCompilerProps {
  /**
   * Prisma schema files ready for compilation as key-value pairs.
   *
   * Contains the generated Prisma schema files with each key representing the
   * schema filename (following the pattern `schema-{number}-{domain}.prisma`)
   * and each value containing the actual Prisma schema content. These files
   * have been generated from validated AST structures and are organized by
   * business domains following domain-driven design principles.
   *
   * The schema files include comprehensive documentation for each entity and
   * attribute, optimal index configurations, proper constraint definitions, and
   * business context explanations derived from the original AST structure. They
   * are immediately ready for Prisma compilation and database deployment.
   */
  files: Record<string, string>;
}
