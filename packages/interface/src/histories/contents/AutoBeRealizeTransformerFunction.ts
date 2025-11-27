/**
 * DTO transformer function implementation.
 *
 * Represents a generated transformer module that converts Prisma database query
 * results to API response DTOs (DB → API). Each transformer provides a
 * type-safe conversion function and a Prisma select specification to
 * efficiently load only the required database fields.
 *
 * Transformers are reusable across multiple API operations that return the same
 * DTO type, promoting code modularity and maintainability.
 *
 * @author Samchon
 */
export interface AutoBeRealizeTransformerFunction {
  /** Type discriminator for transformer function. */
  kind: "transformer";

  /**
   * DTO type name being transformed to.
   *
   * The target TypeScript interface type that the transformer produces.
   *
   * Example: "IShoppingSaleUnitStock"
   */
  dtoTypeName: string;

  /**
   * Prisma schema name being transformed from.
   *
   * The source Prisma table/model name that provides the data.
   *
   * Example: "shopping_sale_snapshot_unit_stocks"
   */
  prismaSchemaName: string;

  /**
   * Dependent transformer names referenced in this transformer.
   *
   * Lists other transformer modules that this transformer imports and uses for
   * nested object transformations. These dependencies are automatically
   * detected by scanning the code for patterns like
   * `{Name}Transformer.select()` or `{Name}Transformer.transform()`.
   *
   * This enables proper dependency tracking and import statement generation,
   * ensuring that nested DTOs are transformed using their dedicated
   * transformers rather than inline mapping logic.
   *
   * Example: ["ShoppingCategoryTransformer", "ShoppingBrandTransformer"]
   */
  neighbors: string[];

  /**
   * File path where the transformer module is generated.
   *
   * The relative path to the TypeScript file containing the transformer
   * namespace with transform() and select() functions.
   *
   * Format: "src/transformers/${PascalCaseTypeName}Transformer.ts" Example:
   * "src/transformers/ShoppingSaleUnitStockTransformer.ts"
   */
  location: string;

  /**
   * Generated TypeScript transformer code.
   *
   * Contains the complete transformer implementation including:
   *
   * - Namespace declaration
   * - Transform() function for DB → DTO conversion
   * - Select() function for Prisma query specification
   * - Proper type annotations with Prisma payload types
   */
  content: string;
}
