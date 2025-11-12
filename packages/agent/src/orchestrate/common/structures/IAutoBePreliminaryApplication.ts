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
  analyzeFiles(
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
  prismaSchemas(props: IAutoBePreliminaryApplication.IPrismaSchemasProps): void;

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
  interfaceOperations(
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
  interfaceSchemas(
    props: IAutoBePreliminaryApplication.IInterfaceSchemasProps,
  ): void;
}
export namespace IAutoBePreliminaryApplication {
  export interface IRequirementAnalysesProps {
    /**
     * Array of requirement analysis document filenames to retrieve.
     *
     * **CRITICAL RULES**:
     *
     * - NEVER include filenames already shown in "Already Loaded Analysis
     *   Documents" section
     * - NEVER pass empty array `[]` - if nothing new to load, do NOT call this
     *   function
     * - NEVER include duplicates within this array
     * - If you see "ALL data has been loaded" message, do NOT call this function
     *
     * **Source Constraint**:
     *
     * - Must select from actual analysis files in current application
     * - Available filenames are listed in conversation history context
     * - Never use arbitrary or imagined filenames
     *
     * **Examples**: "business_requirements.md", "feature_specifications.md"
     */
    fileNames: string[];
  }

  export interface IPrismaSchemasProps {
    /**
     * Array of Prisma model names to retrieve.
     *
     * **CRITICAL RULES**:
     *
     * - NEVER include model names already shown in "Already Loaded Prisma Models"
     *   section
     * - NEVER pass empty array `[]` - if nothing new to load, do NOT call this
     *   function
     * - NEVER include duplicates within this array
     * - If you see "ALL data has been loaded" message, do NOT call this function
     * - Do NOT request ALL models - only request what you specifically need
     *
     * **Source Constraint**:
     *
     * - Must select from actual Prisma schema in current application
     * - Available model names are listed in conversation history context
     * - Never assume or imagine non-existing models
     *
     * **Examples**: "shopping_sale_snapshots", "bbs_article_comments"
     */
    schemaNames: string[];
  }

  export interface IInterfaceOperationsProps {
    /**
     * Array of API endpoint identifiers to retrieve.
     *
     * **CRITICAL RULES**:
     *
     * - NEVER include endpoints already shown in "Already Loaded API Operations"
     *   section
     * - NEVER pass empty array `[]` - if nothing new to load, do NOT call this
     *   function
     * - NEVER include duplicates within this array
     * - If you see "ALL data has been loaded" message, do NOT call this function
     *
     * **Source Constraint**:
     *
     * - Must select from actual OpenAPI operations in current application
     * - Available method-path combinations are listed in conversation history
     *   context
     * - Never assume or imagine non-existing endpoints
     *
     * **Endpoint Format**: Each consists of HTTP method + path
     *
     * - Example: `{ method: "GET", path: "/shopping/customer/sales/{id}" }`
     */
    endpoints: AutoBeOpenApi.IEndpoint[];
  }

  export interface IInterfaceSchemasProps {
    /**
     * Array of TypeScript type names to retrieve from interface schemas.
     *
     * **CRITICAL RULES**:
     *
     * - NEVER include type names already shown in "Already Loaded Type Schemas"
     *   section
     * - NEVER pass empty array `[]` - if nothing new to load, do NOT call this
     *   function
     * - NEVER include duplicates within this array
     * - If you see "ALL data has been loaded" message, do NOT call this function
     *
     * **Source Constraint**:
     *
     * - Must select from actual schema definitions in OpenAPI components/schemas
     * - Available schema names are listed in conversation history context
     * - Never assume or imagine non-existing types
     *
     * **Type Granularity**: Each type name is independent
     *
     * - "IBbsArticle" and "IBbsArticle.ICreate" are DIFFERENT types
     * - Requesting "IBbsArticle" does NOT automatically load
     *   "IBbsArticle.ICreate"
     * - Must explicitly request each nested type you need
     *
     * **Examples**: "IBbsArticle", "IBbsArticle.ICreate",
     * "IPageIShoppingSale.ISummary"
     */
    typeNames: string[];
  }
}
