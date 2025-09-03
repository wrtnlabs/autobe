import { AutoBeOpenApi } from "@autobe/interface";

/**
 * Application interface for reviewing and validating API operations.
 *
 * Provides functionality to systematically review generated API operations
 * against business requirements, technical specifications, and OpenAPI
 * standards. The review process ensures each operation meets quality criteria
 * before proceeding to implementation.
 */
export interface IAutoBeInterfaceOperationsReviewApplication {
  /**
   * Reviews a batch of API operations for quality and correctness.
   *
   * Validates each operation's request/response schemas, authentication
   * handling, error responses, and documentation completeness. Operations are
   * marked as passed or failed based on compliance with enterprise standards.
   *
   * @param input Collection of operations to review with their validation
   *   results
   */
  reviewOperations(
    input: IAutoBeInterfaceOperationsReviewApplication.IProps,
  ): void;
}

export namespace IAutoBeInterfaceOperationsReviewApplication {
  /**
   * Properties for API operation review and improvement process.
   *
   * Contains both the input operations to be reviewed and the outputs generated
   * by the Interface Operations Review Agent, which will be published as part
   * of the AutoBeInterfaceOperationsReviewEvent.
   */
  export interface IProps {
    /**
     * Comprehensive review analysis with prioritized findings.
     *
     * Systematic assessment organized by severity levels (CRITICAL, HIGH,
     * MEDIUM, LOW):
     *
     * - **Security Analysis**: Authentication boundary violations, exposed
     *   passwords/tokens, unauthorized data access patterns, SQL injection
     *   risks
     * - **Logic Validation**: Return type consistency (list operations returning
     *   arrays, single retrieval returning single items), HTTP method semantics
     *   alignment, parameter usage verification
     * - **Schema Compliance**: Field existence in Prisma schema, type accuracy,
     *   relationship validity, required field handling
     * - **Quality Assessment**: Documentation completeness, naming conventions,
     *   error handling patterns, pagination standards
     *
     * Each finding includes specific examples, current vs expected behavior,
     * and concrete fix recommendations. Critical security issues and logical
     * contradictions are highlighted for immediate attention.
     */
    review: string;

    /**
     * Prioritized action plan for identified issues.
     *
     * Structured improvement strategy categorized by severity:
     *
     * - **Immediate Actions (CRITICAL)**: Security vulnerabilities that must be
     *   fixed before production (password exposure, missing authorization,
     *   authentication bypass risks)
     * - **Required Fixes (HIGH)**: Functional issues affecting API correctness
     *   (wrong return types, missing required fields, schema mismatches)
     * - **Recommended Improvements (MEDIUM)**: Quality enhancements for better
     *   API design (validation rules, format specifications, consistency)
     * - **Optional Enhancements (LOW)**: Documentation and usability improvements
     *
     * If all operations pass review without issues, contains: "No improvements
     * required. All operations meet AutoBE standards."
     *
     * Each action item includes the specific operation path, the exact change
     * needed, and the rationale for the modification.
     */
    plan: string;

    /**
     * Production-ready operations with all critical issues resolved.
     *
     * Final API operations after systematic enhancement:
     *
     * - **Security Fixes Applied**: All authentication boundaries enforced,
     *   sensitive data removed from responses, proper authorization
     *   implemented
     * - **Logic Corrections Made**: Return types match operation intent, HTTP
     *   methods align with semantics, parameters properly utilized
     * - **Schema Alignment Verified**: All fields exist in Prisma schema, types
     *   correctly mapped, relationships properly defined
     * - **Quality Improvements Added**: Enhanced documentation, format
     *   specifications, validation rules, consistent naming patterns
     *
     * If no issues were found during review, this contains the exact original
     * operations unchanged. These operations are validated and ready for schema
     * generation and subsequent implementation phases.
     */
    content: IOperation[];
  }

  /**
   * Operation of the Restful API.
   *
   * This interface defines a single API endpoint with its HTTP {@link method},
   * {@link path}, {@link parameters path parameters},
   * {@link requestBody request body}, and {@link responseBody} structure. It
   * corresponds to an individual operation in the paths section of an OpenAPI
   * document.
   *
   * Each operation requires a detailed explanation of its purpose through the
   * reason and description fields, making it clear why the API was designed and
   * how it should be used.
   *
   * All request bodies and responses for this operation must be object types
   * and must reference named types defined in the components section. The
   * content-type is always `application/json`. For file upload/download
   * operations, use `string & tags.Format<"uri">` in the appropriate schema
   * instead of binary data formats.
   *
   * In OpenAPI, this might represent:
   *
   * ```json
   * {
   *   "/shoppings/customers/orders": {
   *     "post": {
   *       "description": "Create a new order application from shopping cart...",
   *       "parameters": [...],
   *       "requestBody": {...},
   *       "responses": {...}
   *     }
   *   }
   * }
   * ```
   */
  export interface IOperation
    extends Omit<AutoBeOpenApi.IOperation, "authorizationType"> {
    /**
     * Primary Prisma model name for this operation.
     *
     * Identifies the main database table/model that this operation targets.
     * This must match exactly with the Prisma model name defined in the schema.
     * When soft deletion is specified, this model name indicates which table
     * should be soft-deleted.
     *
     * For example:
     *
     * - In a "GET /users/:id" operation, this would be "User"
     * - In a "POST /articles" operation, this would be "Article"
     * - In a "DELETE /comments/:id" with soft delete, this specifies the
     *   "Comment" model to soft-delete
     *
     * This property is essential for:
     *
     * - Determining the primary entity for CRUD operations
     * - Identifying which table to apply soft deletion to
     * - Validating operations against the correct Prisma model
     * - Generating appropriate database queries and validations
     */
    model_name: string;

    /**
     * Soft delete column name for the Prisma models.
     *
     * Specifies the column name used for soft deletion in the database tables
     * associated with this operation. When set to a non-null value, it
     * indicates that the related entities support soft deletion through this
     * column (typically a timestamp field like `deleted_at` or `deletedAt`).
     *
     * When null, it means the entities involved in this operation use hard
     * deletion or don't support deletion at all. This information is crucial
     * for generating appropriate CRUD operations and ensuring data integrity
     * policies are correctly implemented.
     *
     * Common soft delete patterns:
     *
     * - `"deleted_at"`: Records deletion timestamp
     * - `"deletedAt"`: Camel-cased deletion timestamp
     * - `"is_deleted"`: Boolean flag for deletion status
     * - `null`: No soft deletion (hard delete only)
     */
    soft_delete_column: string | null;
  }
}
