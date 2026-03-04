import { AutoBeInterfaceSchemaPropertyExclude } from "../histories/contents/AutoBeInterfaceSchemaPropertyExclude";
import { AutoBeInterfaceSchemaPropertyRevise } from "../histories/contents/AutoBeInterfaceSchemaPropertyRevise";
import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";
import { AutoBeAcquisitionEventBase } from "./base/AutoBeAcquisitionEventBase";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired during the unified review and validation phase of OpenAPI schema
 * generation process.
 *
 * This event represents the activity of a single unified Schema Review Agent
 * that validates schemas across all dimensions simultaneously: security,
 * relation structure, content completeness, and phantom detection.
 *
 * The Schema Review Agent performs comprehensive validation including:
 *
 * - **Security**: Password/token field protection, session context placement,
 *   actor DTO compliance
 * - **Relations**: Relation classification, FK-to-object transformation, circular
 *   reference removal
 * - **Content**: Field completeness, type accuracy, nullability, DB coverage
 *   verification
 * - **Phantom detection**: Identifying and erasing fields with no DB mapping, no
 *   recognized role, and no valid specification
 *
 * The review agent runs twice per schema generation cycle to ensure
 * convergence. Each run produces `excludes` (DB properties not in the DTO) and
 * `revises` (property-level operations: keep, create, update, depict, erase,
 * nullish).
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaReviewEvent
  extends
    AutoBeEventBase<"interfaceSchemaReview">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase,
    AutoBeAcquisitionEventBase<
      | "analysisSections"
      | "databaseSchemas"
      | "interfaceOperations"
      | "interfaceSchemas"
      | "previousAnalysisSections"
      | "previousDatabaseSchemas"
      | "previousInterfaceOperations"
      | "previousInterfaceSchemas"
    > {
  /**
   * Type name of the schema being reviewed.
   *
   * Specifies the specific DTO type name that is being validated in this
   * review. Examples: "IUser.ICreate", "IProduct.ISummary", "IBbsArticle"
   */
  typeName: string;

  /**
   * Original schema submitted for review.
   *
   * Contains the OpenAPI schema requiring validation. The schema is the full
   * descriptive JSON schema structure with AutoBE-specific metadata.
   */
  schema: AutoBeOpenApi.IJsonSchemaDescriptive;

  /**
   * Summary of issues found and fixes applied during the review.
   *
   * Documents all issues discovered during validation across security,
   * relations, content completeness, and phantom detection. Each finding
   * includes the affected property, specific problem, and correction applied.
   */
  review: string;

  /**
   * Database properties explicitly excluded from this DTO.
   *
   * Each entry declares a database property that intentionally does not appear
   * in this DTO, along with the reason for exclusion (e.g., "aggregation
   * relation", "internal field", "handled by separate endpoint").
   */
  excludes: AutoBeInterfaceSchemaPropertyExclude[];

  /**
   * Property-level revisions applied during review.
   *
   * Every DTO property must appear exactly once. Every database property must
   * be addressed either here (via `databaseSchemaProperty`) or in `excludes`.
   */
  revises: AutoBeInterfaceSchemaPropertyRevise[];

  /**
   * Current iteration number of the schema generation being reviewed.
   *
   * Indicates which version of the schemas is undergoing validation, helping
   * track the iterative refinement process.
   */
  step: number;
}
