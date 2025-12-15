import { AutoBeOpenApi, CamelCasePattern } from "@autobe/interface";
import { tags } from "typia";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousPrismaSchemas";
import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

export interface IAutoBeInterfaceOperationApplication {
  /**
   * Process operation generation task or preliminary data requests.
   *
   * Creates complete API operations following REST principles and quality
   * standards. Processes operations with progress tracking to ensure iterative
   * completion.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeInterfaceOperationApplication.IProps): void;
}
export namespace IAutoBeInterfaceOperationApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisFiles, getPrismaSchemas, etc.):
     *
     * - What critical information is missing that you don't already have?
     * - Why do you need it specifically right now?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For completion (complete):
     *
     * - What key assets did you acquire?
     * - What did you accomplish?
     * - Why is it sufficient to complete?
     * - Summarize - don't enumerate every single item.
     *
     * This reflection helps you avoid duplicate requests and premature
     * completion.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getAnalysisFiles, getPrismaSchemas, getPreviousAnalysisFiles,
     * getPreviousPrismaSchemas) or final operation generation (complete). When
     * preliminary returns empty array, that type is removed from the union,
     * physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPrismaSchemas
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPreviousPrismaSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations;
  }

  /**
   * Request to generate detailed API operations.
   *
   * Executes operation generation to create complete API operations following
   * REST principles and quality standards. Each operation includes
   * specification, path, method, detailed description, summary, parameters, and
   * request/response bodies.
   */
  export interface IComplete {
    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval or actual
     * task execution. Value "complete" indicates this is the final task
     * execution request.
     */
    type: "complete";

    /**
     * Array of API operations to generate.
     *
     * Each operation in this array includes:
     *
     * - Specification: Detailed API specification with clear purpose and
     *   functionality
     * - Path: Resource-centric URL path (e.g., "/resources/{resourceId}")
     * - Method: HTTP method (get, post, put, delete, patch)
     * - Description: Extremely detailed multi-paragraph description referencing
     *   Prisma schema comments
     * - Summary: Concise one-sentence summary of the endpoint
     * - Parameters: Array of all necessary parameters with descriptions and
     *   schema definitions
     * - RequestBody: For POST/PUT/PATCH methods, with typeName referencing
     *   components.schemas
     * - ResponseBody: With typeName referencing appropriate response type
     *
     * All operations follow strict quality standards:
     *
     * 1. Detailed descriptions referencing Prisma schema comments
     * 2. Accurate parameter definitions matching path parameters
     * 3. Appropriate request/response body type references
     * 4. Consistent patterns for CRUD operations
     *
     * For list retrievals (typically PATCH), include pagination, search, and
     * sorting. For detail retrieval (GET), return a single resource. For
     * creation (POST), use .ICreate request body. For modification (PUT), use
     * .IUpdate request body.
     */
    operations: IOperation[];
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
   * DO: Use object types for all request bodies and responses. DO: Reference
   * named types defined in the components section. DO: Use `application/json`
   * as the content-type. DO: Use `string & tags.Format<"uri">` in the schema
   * for file upload/download operations instead of binary data formats.
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
    extends Omit<
      AutoBeOpenApi.IOperation,
      "authorizationActor" | "prerequisites"
    > {
    /**
     * Authorization actors required to access this API operation.
     *
     * This field specifies which user actors are allowed to access this
     * endpoint. Multiple actors can be specified to allow different types of
     * users to access the same endpoint.
     *
     * ## ⚠️ CRITICAL: Actor Multiplication Effect
     *
     * **EACH ACTOR IN THIS ARRAY GENERATES A SEPARATE ENDPOINT**
     *
     * - If you specify `["admin", "moderator", "member"]`, this creates 3
     *   separate endpoints
     * - Total generated endpoints = operations × average actors.length
     * - Example: 100 operations with 3 actors each = 300 actual endpoints
     *
     * ## 🔴 AVOID OVER-GENERATION
     *
     * **DO NOT create actor-specific endpoints when a public endpoint would
     * suffice:**
     *
     * - ❌ BAD: Separate GET endpoints for admin, member, moderator to view the
     *   same public data
     * - ✅ GOOD: Single public endpoint `[]` with actor-based filtering in
     *   business logic
     *
     * **DO NOT enumerate all possible actors when the Prisma schema uses a
     * single User table:**
     *
     * - If Prisma has a User table with role/permission fields, you likely only
     *   need `["user"]`
     * - Avoid listing `["admin", "seller", "buyer", "moderator", ...]`
     *   unnecessarily
     * - The actual actor checking happens in business logic, not at the endpoint
     *   level
     *
     * ## Naming Convention
     *
     * DO: Use camelCase for all actor names.
     *
     * ## Important Guidelines
     *
     * - Set to empty array `[]` for public endpoints that require no
     *   authentication
     * - Set to array with actor strings for actor-restricted endpoints
     * - **MINIMIZE the number of actors per endpoint to prevent explosion**
     * - Consider if the endpoint can be public with actor-based filtering instead
     * - The actor names match exactly with the user type/actor defined in the
     *   database
     * - This will be used by the Realize Agent to generate appropriate decorator
     *   and authorization logic in the provider functions
     * - The controller will apply the corresponding authentication decorator
     *   based on these actors
     *
     * ## Examples
     *
     * - `[]` - Public endpoint, no authentication required (PREFERRED for read
     *   operations)
     * - `["user"]` - Any authenticated user can access (PREFERRED for
     *   user-specific operations)
     * - `["admin"]` - Only admin users can access (USE SPARINGLY)
     * - `["admin", "moderator"]` - Both admin and moderator users can access
     *   (AVOID if possible)
     * - `["seller"]` - Only seller users can access (ONLY if Seller is a separate
     *   table)
     *
     * ## Best Practices
     *
     * 1. **Start with public `[]` for all read operations** unless sensitive data
     *    is involved
     * 2. **Use single actor `["user"]` for authenticated operations** and handle
     *    permissions in business logic
     * 3. **Only use multiple actors when absolutely necessary** for different
     *    business logic paths
     * 4. **Remember: Fewer actors = Fewer endpoints = Better performance and
     *    maintainability**
     *
     * Note: The actual authentication/authorization implementation will be
     * handled by decorators at the controller level, and the provider function
     * will receive the authenticated user object with the appropriate type.
     */
    authorizationActors: Array<string & CamelCasePattern & tags.MinLength<1>>;
  }
}
