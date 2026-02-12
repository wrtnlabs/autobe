import { AutoBeInterfaceSchemaPropertyExclude } from "../histories/contents/AutoBeInterfaceSchemaPropertyExclude";
import { AutoBeInterfaceSchemaPropertyRefine } from "../histories/contents/AutoBeInterfaceSchemaPropertyRefine";
import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";
import { AutoBeAcquisitionEventBase } from "./base/AutoBeAcquisitionEventBase";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired during the schema property refinement phase of OpenAPI schema
 * generation process.
 *
 * This event represents the activity of the Interface Schema Refine Agent,
 * which enriches pure JSON Schema structures with documentation and metadata.
 * Initial JSON Schema generation produces only type structure (`type`,
 * `properties`, `$ref`, etc.) without descriptive information. The refine phase
 * adds `databaseSchemaProperty`, `specification`, and `description` to each
 * property.
 *
 * The Interface Schema Refine Agent performs enrichment operations including:
 *
 * - **depict**: Add documentation to existing property
 * - **create**: Add missing property with documentation
 * - **update**: Fix incorrect type and add documentation
 * - **erase**: Remove invalid property
 *
 * The agent reviews both object-level metadata (`databaseSchema`,
 * `specification`, `description`) and property-level documentation to ensure
 * complete and accurate schema definitions that properly map to database
 * entities.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaRefineEvent
  extends
    AutoBeEventBase<"interfaceSchemaRefine">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase,
    AutoBeAcquisitionEventBase<
      | "analysisFiles"
      | "databaseSchemas"
      | "interfaceOperations"
      | "interfaceSchemas"
      | "previousAnalysisFiles"
      | "previousDatabaseSchemas"
      | "previousInterfaceOperations"
      | "previousInterfaceSchemas"
    > {
  /**
   * Type name of the schema being refined.
   *
   * Specifies the specific DTO type name that is being enriched with
   * documentation and metadata. Examples: "IUser.ICreate", "IProduct.ISummary",
   * "IBbsArticle"
   */
  typeName: string;

  /**
   * Original schema submitted for refinement.
   *
   * Contains the OpenAPI schema requiring enrichment with documentation and
   * metadata. The schema is the full descriptive JSON schema structure that
   * needs `specification` and `description` fields populated for each
   * property.
   */
  schema: AutoBeOpenApi.IJsonSchema;

  /**
   * Review findings from the refinement process.
   *
   * Documents the agent's analysis of the schema's current state, including
   * which properties need documentation, any structural issues discovered, and
   * the overall completeness assessment of the schema metadata.
   */
  review: string;

  /**
   * Database schema context for the type.
   *
   * Specifies which database table or entity this schema maps to, providing
   * context for property-level database field mappings. Set to `null` for types
   * that don't map to a single database table.
   */
  databaseSchema: string | null;

  /**
   * Specification for the schema implementation.
   *
   * Documents HOW the schema should be implemented, including data source
   * mappings, transformation rules, and technical implementation details.
   */
  specification: string;

  /**
   * Description for API consumers.
   *
   * Documents WHAT the schema represents for API consumers, explaining the
   * purpose and usage of this data type in the API context.
   */
  description: string;

  /**
   * Database properties explicitly excluded from this DTO.
   *
   * Each entry declares a database property that intentionally does not appear
   * in this DTO, along with the reason for exclusion (e.g., "aggregation
   * relation", "internal field", "handled by separate endpoint").
   */
  excludes: AutoBeInterfaceSchemaPropertyExclude[];

  /**
   * Refinement operations performed on the DTO schema properties.
   *
   * Contains the list of operations executed to enrich schema properties:
   *
   * - **depict**: Documentation added to existing property
   * - **create**: New property created with documentation
   * - **update**: Property type corrected and documented
   * - **erase**: Invalid property removed
   *
   * Every DTO property must appear exactly once. Every database property must
   * be addressed either here (via `databaseSchemaProperty`) or in `excludes`.
   */
  revises: AutoBeInterfaceSchemaPropertyRefine[];

  /**
   * Current iteration number of the schema refinement.
   *
   * Indicates which version of the schemas is undergoing refinement, helping
   * track the iterative enrichment process.
   */
  step: number;
}
