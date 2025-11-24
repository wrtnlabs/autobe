/**
 * DTO collector function implementation.
 *
 * Represents a generated collector module that prepares Prisma input data from
 * API request DTOs (API → DB). Each collector provides a type-safe conversion
 * function that transforms request payloads into the nested Prisma input
 * structures required for database operations.
 *
 * Collectors handle complex scenarios including nested relationships, UUID
 * generation, data validation, and proper Prisma connect/create/update syntax.
 * They are reusable across multiple API operations that accept the same input
 * DTO type.
 *
 * @author Samchon
 */
export interface AutoBeRealizeCollectorFunction {
  /**
   * Type discriminator for collector function.
   */
  kind: "collector";

  /**
   * DTO type name being collected from.
   *
   * The source TypeScript interface type that provides input data.
   *
   * Example: "IShoppingSaleUnitStock.ICreate"
   */
  dtoTypeName: string;

  /**
   * Prisma schema name being collected to.
   *
   * The target Prisma table/model name that receives the collected data.
   * This is determined by the transformer during analysis and passed to the
   * collector to ensure consistency.
   *
   * Example: "shopping_sale_snapshot_unit_stocks"
   */
  prismaSchemaName: string;

  /**
   * File path where the collector module is generated.
   *
   * The relative path to the TypeScript file containing the collector namespace
   * with collect() function.
   *
   * Format: "src/collectors/${PascalCaseTypeName}Collector.ts"
   * Example: "src/collectors/ShoppingSaleUnitStockCollector.ts"
   */
  location: string;

  /**
   * Generated TypeScript collector code.
   *
   * Contains the complete collector implementation including:
   * - Namespace declaration
   * - collect() function for DTO → Prisma input conversion
   * - Proper handling of nested relationships
   * - UUID generation for new records
   * - Proper type annotations with Prisma input types
   */
  content: string;
}
