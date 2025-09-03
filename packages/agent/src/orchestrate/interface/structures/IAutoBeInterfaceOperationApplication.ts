import { AutoBeOpenApi, CamelPattern } from "@autobe/interface";
import { tags } from "typia";

export interface IAutoBeInterfaceOperationApplication {
  /**
   * Generate detailed API operations from path/method combinations.
   *
   * This function creates complete API operations following REST principles and
   * quality standards. Each generated operation includes specification, path,
   * method, detailed multi-paragraph description, concise summary, parameters,
   * and appropriate request/response bodies.
   *
   * The function processes as many operations as possible in a single call,
   * with progress tracking to ensure iterative completion of all required
   * endpoints.
   *
   * @param props Properties containing the operations to generate.
   */
  makeOperations(props: IAutoBeInterfaceOperationApplication.IProps): void;
}
export namespace IAutoBeInterfaceOperationApplication {
  export interface IProps {
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
      "authorizationRole" | "authorizationType"
    > {
    /**
     * Authorization roles required to access this API operation.
     *
     * This field specifies which user roles are allowed to access this
     * endpoint. Multiple roles can be specified to allow different types of
     * users to access the same endpoint.
     *
     * ## ⚠️ CRITICAL: Role Multiplication Effect
     *
     * **EACH ROLE IN THIS ARRAY GENERATES A SEPARATE ENDPOINT**
     *
     * - If you specify `["admin", "moderator", "member"]`, this creates 3
     *   separate endpoints
     * - Total generated endpoints = operations × average roles.length
     * - Example: 100 operations with 3 roles each = 300 actual endpoints
     *
     * ## 🔴 AVOID OVER-GENERATION
     *
     * **DO NOT create role-specific endpoints when a public endpoint would
     * suffice:**
     *
     * - ❌ BAD: Separate GET endpoints for admin, member, moderator to view the
     *   same public data
     * - ✅ GOOD: Single public endpoint `[]` with role-based filtering in business
     *   logic
     *
     * **DO NOT enumerate all possible roles when the Prisma schema uses a
     * single User table:**
     *
     * - If Prisma has a User table with role/permission fields, you likely only
     *   need `["user"]`
     * - Avoid listing `["admin", "seller", "buyer", "moderator", ...]`
     *   unnecessarily
     * - The actual role checking happens in business logic, not at the endpoint
     *   level
     *
     * ## Naming Convention
     *
     * DO: Use camelCase for all role names.
     *
     * ## Important Guidelines
     *
     * - Set to empty array `[]` for public endpoints that require no
     *   authentication
     * - Set to array with role strings for role-restricted endpoints
     * - **MINIMIZE the number of roles per endpoint to prevent explosion**
     * - Consider if the endpoint can be public with role-based filtering instead
     * - The role names match exactly with the user type/role defined in the
     *   database
     * - This will be used by the Realize Agent to generate appropriate decorator
     *   and authorization logic in the provider functions
     * - The controller will apply the corresponding authentication decorator
     *   based on these roles
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
     * 2. **Use single role `["user"]` for authenticated operations** and handle
     *    permissions in business logic
     * 3. **Only use multiple roles when absolutely necessary** for different
     *    business logic paths
     * 4. **Remember: Fewer roles = Fewer endpoints = Better performance and
     *    maintainability**
     *
     * Note: The actual authentication/authorization implementation will be
     * handled by decorators at the controller level, and the provider function
     * will receive the authenticated user object with the appropriate type.
     */
    authorizationRoles: Array<string & CamelPattern & tags.MinLength<1>>;
  }
}
