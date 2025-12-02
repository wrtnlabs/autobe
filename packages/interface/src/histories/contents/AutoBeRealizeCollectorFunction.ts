import { AutoBeRealizeCollectorPlan } from "./AutoBeRealizeCollectorPlan";

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
  /** Type discriminator for collector function. */
  type: "collector";

  /**
   * Planning information for this collector.
   *
   * Contains the original planning decision including DTO type name, Prisma
   * table mapping, planning reasoning, and foreign key references. This
   * information guides the generated collector's structure and behavior.
   */
  plan: AutoBeRealizeCollectorPlan;

  /**
   * Dependent collector names referenced in this collector.
   *
   * Lists other collector modules that this collector imports and uses for
   * nested create operations. These dependencies are automatically detected by
   * scanning the code for patterns like `{Name}Collector.collect()`.
   *
   * This enables proper dependency tracking and import statement generation,
   * ensuring that nested Create DTOs are collected using their dedicated
   * collectors rather than inline mapping logic.
   *
   * Example: ["ShoppingSaleTagCollector", "ShoppingSaleInventoryCollector"]
   */
  neighbors: string[];

  /**
   * File path where the collector module is generated.
   *
   * The relative path to the TypeScript file containing the collector namespace
   * with collect() function.
   *
   * Format: "src/collectors/${PascalCaseTypeName}Collector.ts" Example:
   * "src/collectors/ShoppingSaleUnitStockCollector.ts"
   */
  location: string;

  /**
   * Generated TypeScript collector code.
   *
   * Contains the complete collector implementation including:
   *
   * - Namespace declaration
   * - `collect()` function for DTO → Prisma input conversion
   * - Proper handling of nested relationships
   * - UUID generation for new records
   * - Proper type annotations with Prisma input types
   */
  content: string;
}
