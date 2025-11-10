import { AutoBeOpenApi } from "@autobe/interface";

export interface IAutoBePreliminaryApplication {
  /**
   * Retrieves requirement analysis documents.
   *
   * Fetches requirement analysis documents containing user intent, feature
   * descriptions, and business logic. Each document includes full content and
   * metadata.
   *
   * Be careful not to request the same documents that have already been loaded
   * into context.
   */
  getRequirementAnalyses(
    props: IAutoBePreliminaryApplication.IRequirementAnalysesProps,
  ): void;

  /**
   * Retrieves Prisma database schema models.
   *
   * Fetches database model definitions including fields, data types, relations,
   * indexes, and constraints. Essential for understanding database structure
   * and entity relationships.
   *
   * Be careful not to request the same models that have already been loaded
   * into context.
   */
  gerPrismaSchemas(
    props: IAutoBePreliminaryApplication.IPrismaSchemasProps,
  ): void;

  /**
   * Retrieves OpenAPI operation specifications.
   *
   * Fetches API endpoint definitions including HTTP method, path, request
   * parameters, request body schema, response schemas, and documentation.
   * Essential for understanding API contracts and signatures.
   *
   * Be careful not to request the same operations that have already been loaded
   * into context.
   */
  getInterfaceOperations(
    props: IAutoBePreliminaryApplication.IInterfaceOperationsProps,
  ): void;

  /**
   * Retrieves TypeScript type schemas.
   *
   * Fetches detailed type definitions in JSON Schema format, including property
   * names, types, validation rules, descriptions, and constraints. Essential
   * for understanding data structures and their relationships.
   *
   * Be careful not to request the same schemas that have already been loaded
   * into context.
   */
  getInterfaceSchemas(
    props: IAutoBePreliminaryApplication.IInterfaceSchemasProps,
  ): void;
}
export namespace IAutoBePreliminaryApplication {
  export interface IRequirementAnalysesProps {
    /**
     * Array of requirement analysis document filenames to retrieve.
     *
     * Must select filenames from the actual analysis files that exist in the
     * current application. Never use arbitrary or imagined filenames.
     *
     * Common examples include "business_requirements.md",
     * "feature_specifications.md", or custom document names.
     *
     * The available filenames are provided as context when calling this
     * function.
     */
    filenames: string[];
  }

  export interface IPrismaSchemasProps {
    /**
     * Array of Prisma model names to retrieve.
     *
     * Must select model names from the actual Prisma schema defined in the
     * current application. Never assume or imagine non-existing models.
     *
     * Examples: "shopping_sale_snapshots", "bbs_article_comments"
     *
     * The available model names are provided as context when calling this
     * function.
     */
    schemas: string[];
  }

  export interface IInterfaceOperationsProps {
    /**
     * Array of API endpoint identifiers to retrieve.
     *
     * Must select endpoints from the actual OpenAPI operations defined in the
     * current application. Never assume or imagine non-existing endpoints.
     *
     * Each endpoint consists of an HTTP method and path combination (e.g.,
     * method: "GET", path: "/shopping/customer/sales/{id}").
     *
     * The available method-path combinations are provided as context when
     * calling this function.
     */
    endpoints: AutoBeOpenApi.IEndpoint[];
  }

  export interface IInterfaceSchemasProps {
    /**
     * Array of TypeScript type names to retrieve from interface schemas.
     *
     * Must select type names from the actual schema definitions in the current
     * application's OpenAPI components/schemas. Never assume or imagine
     * non-existing types.
     *
     * The available schema names are provided as context when calling this
     * function.
     *
     * - Examples: "IBbsArticle", "IBbsArticle.ICreate",
     *   "IPageIShoppingSale.ISummary"
     * - Be careful: "IBbsArticle" and "IBbsArticle.ICreate" are different types.
     *   Requesting "IBbsArticle" does not automatically load
     *   "IBbsArticle.ICreate".
     */
    typeNames: string[];
  }
}
