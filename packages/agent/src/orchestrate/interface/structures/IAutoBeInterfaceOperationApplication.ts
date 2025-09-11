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
    extends AutoBeOpenApi.IEndpoint {
    /**
     * Specification of the API operation.
     *
     * Before defining the API operation interface, please describe what you're
     * planning to write in this `specification` field.
     *
     * The specification must be fully detailed and clear, so that anyone can
     * understand the purpose and functionality of the API operation and its
     * related components (e.g., {@link path}, {@link parameters},
     * {@link requestBody}).
     *
     * IMPORTANT: The specification MUST identify which Prisma DB table this
     * operation is associated with, helping ensure complete coverage of all
     * database entities.
     */
    specification: string;

    /**
     * Detailed description about the API operation.
     *
     * IMPORTANT: This field MUST be extensively detailed and MUST reference the
     * description comments from the related Prisma DB schema tables and
     * columns. The description should be organized into MULTIPLE PARAGRAPHS
     * separated by line breaks to improve readability and comprehension.
     *
     * For example, include separate paragraphs for:
     *
     * - The purpose and overview of the API operation
     * - Security considerations and user permissions
     * - Relationship to underlying database entities
     * - Validation rules and business logic
     * - Related API operations that might be used together with this one
     * - Expected behavior and error handling
     *
     * When writing the description, be sure to incorporate the corresponding DB
     * schema's description comments, matching the level of detail and style of
     * those comments. This ensures consistency between the API documentation
     * and database structure.
     *
     * If there's a dependency to other APIs, please describe the dependency API
     * operation in this field with detailed reason. For example, if this API
     * operation needs a pre-execution of other API operation, it must be
     * explicitly described.
     *
     * - `GET /shoppings/customers/sales` must be pre-executed to get entire list
     *   of summarized sales. Detailed sale information would be obtained by
     *   specifying the sale ID in the path parameter.
     *
     * **CRITICAL WARNING about soft delete keywords**: DO NOT use terms like
     * "soft delete", "soft-delete", or similar variations in this description
     * UNLESS the operation actually implements soft deletion. These keywords
     * trigger validation logic that expects a corresponding soft_delete_column
     * to be specified. Only use these terms when you intend to implement soft
     * deletion (marking records as deleted without removing them from the
     * database).
     *
     * Example of problematic description: ❌ "This would normally be a
     * soft-delete, but we intentionally perform permanent deletion here" - This
     * triggers soft delete validation despite being a hard delete operation.
     *
     * > MUST be written in English. Never use other languages.
     */
    description: string;

    /**
     * Short summary of the API operation.
     *
     * This should be a concise description of the API operation, typically one
     * sentence long. It should provide a quick overview of what the API does
     * without going into too much detail.
     *
     * This summary will be used in the OpenAPI documentation to give users a
     * quick understanding of the API operation's purpose.
     *
     * IMPORTANT: The summary should clearly indicate which Prisma DB table this
     * operation relates to, helping to ensure all tables have API coverage.
     *
     * **CRITICAL WARNING about soft delete keywords**: DO NOT use terms like
     * "soft delete", "soft-delete", or similar variations in this summary
     * UNLESS the operation actually implements soft deletion. These keywords
     * trigger validation logic that expects a corresponding soft_delete_column
     * to be specified. Only use these terms when you intend to implement soft
     * deletion (marking records as deleted without removing them from the
     * database).
     *
     * > MUST be written in English. Never use other languages
     */
    summary: string;

    /**
     * List of path parameters.
     *
     * Note that, the {@link AutoBeOpenApi.IParameter.name identifier name} of
     * path parameter must be corresponded to the
     * {@link path API operation path}.
     *
     * For example, if there's an API operation which has {@link path} of
     * `/shoppings/customers/sales/{saleId}/questions/${questionId}/comments/${commentId}`,
     * its list of {@link AutoBeOpenApi.IParameter.name path parameters} must be
     * like:
     *
     * - `saleId`
     * - `questionId`
     * - `commentId`
     */
    parameters: AutoBeOpenApi.IParameter[];

    /**
     * Request body of the API operation.
     *
     * Defines the payload structure for the request. Contains a description and
     * schema reference to define the expected input data.
     *
     * Should be `null` for operations that don't require a request body, such
     * as most "get" operations.
     */
    requestBody: AutoBeOpenApi.IRequestBody | null;

    /**
     * Response body of the API operation.
     *
     * Defines the structure of the successful response data. Contains a
     * description and schema reference for the returned data.
     *
     * Should be null for operations that don't return any data.
     */
    responseBody: AutoBeOpenApi.IResponseBody | null;

    /**
     * Functional name of the API endpoint.
     *
     * This is a semantic identifier that represents the primary function or
     * purpose of the API endpoint. It serves as a canonical name that can be
     * used for code generation, SDK method names, and internal references.
     *
     * ## Reserved Word Restrictions
     *
     * CRITICAL: The name MUST NOT be a TypeScript/JavaScript reserved word, as
     * it will be used as a class method name in generated code. Avoid names
     * like:
     *
     * - `delete`, `for`, `if`, `else`, `while`, `do`, `switch`, `case`, `break`
     * - `continue`, `function`, `return`, `with`, `in`, `of`, `instanceof`
     * - `typeof`, `void`, `var`, `let`, `const`, `class`, `extends`, `import`
     * - `export`, `default`, `try`, `catch`, `finally`, `throw`, `new`
     * - `super`, `this`, `null`, `true`, `false`, `async`, `await`
     * - `yield`, `static`, `private`, `protected`, `public`, `implements`
     * - `interface`, `package`, `enum`, `debugger`
     *
     * Instead, use alternative names for these operations:
     *
     * - Use `erase` instead of `delete`
     * - Use `iterate` instead of `for`
     * - Use `when` instead of `if`
     * - Use `cls` instead of `class`
     *
     * ## Standard Endpoint Names
     *
     * Use these conventional names based on the endpoint's primary function:
     *
     * - **`index`**: List/search operations that return multiple entities
     *
     *   - Typically used with PATCH method for complex queries
     *   - Example: `PATCH /users` → `name: "index"`
     * - **`at`**: Retrieve a specific entity by identifier
     *
     *   - Typically used with GET method on single resource
     *   - Example: `GET /users/{userId}` → `name: "at"`
     * - **`create`**: Create a new entity
     *
     *   - Typically used with POST method
     *   - Example: `POST /users` → `name: "create"`
     * - **`update`**: Update an existing entity
     *
     *   - Typically used with PUT method
     *   - Example: `PUT /users/{userId}` → `name: "update"`
     * - **`erase`**: Delete/remove an entity (NOT `delete` - reserved word!)
     *
     *   - Typically used with DELETE method
     *   - Example: `DELETE /users/{userId}` → `name: "erase"`
     *
     * ## Custom Endpoint Names
     *
     * For specialized operations beyond basic CRUD, use descriptive verbs:
     *
     * - **`activate`**: Enable or turn on a feature/entity
     * - **`deactivate`**: Disable or turn off a feature/entity
     * - **`approve`**: Approve a request or entity
     * - **`reject`**: Reject a request or entity
     * - **`publish`**: Make content publicly available
     * - **`archive`**: Move to archived state
     * - **`restore`**: Restore from archived/deleted state
     * - **`duplicate`**: Create a copy of an entity
     * - **`transfer`**: Move ownership or change assignment
     * - **`validate`**: Validate data or state
     * - **`process`**: Execute a business process or workflow
     * - **`export`**: Generate downloadable data
     * - **`import`**: Process uploaded data
     *
     * ## Naming Guidelines
     *
     * - MUST use camelCase naming convention
     * - Use singular verb forms
     * - Be concise but descriptive
     * - Avoid abbreviations unless widely understood
     * - Ensure the name clearly represents the endpoint's primary action
     * - For nested resources, focus on the action rather than hierarchy
     * - NEVER use JavaScript/TypeScript reserved words
     *
     * Valid Examples:
     *
     * - `index`, `create`, `update`, `erase` (single word)
     * - `updatePassword`, `cancelOrder`, `publishArticle` (camelCase)
     * - `validateEmail`, `generateReport`, `exportData` (camelCase)
     *
     * Invalid Examples:
     *
     * - `update_password` (snake_case not allowed)
     * - `UpdatePassword` (PascalCase not allowed)
     * - `update-password` (kebab-case not allowed)
     *
     * Path to Name Examples:
     *
     * - `GET /shopping/orders/{orderId}/items` → `name: "index"` (lists items)
     * - `POST /shopping/orders/{orderId}/cancel` → `name: "cancel"`
     * - `PUT /users/{userId}/password` → `name: "updatePassword"`
     *
     * ## Uniqueness Rule
     *
     * The `name` must be unique within the API's accessor namespace. The
     * accessor is formed by combining the path segments (excluding parameters)
     * with the operation name.
     *
     * Accessor formation:
     *
     * 1. Extract non-parameter segments from the path (remove `{...}` parts)
     * 2. Join segments with dots
     * 3. Append the operation name
     *
     * Examples:
     *
     * - Path: `/shopping/sale/{saleId}/review/{reviewId}`, Name: `at` → Accessor:
     *   `shopping.sale.review.at`
     * - Path: `/users/{userId}/posts`, Name: `index` → Accessor:
     *   `users.posts.index`
     * - Path: `/auth/login`, Name: `signIn` → Accessor: `auth.login.signIn`
     *
     * Each accessor must be globally unique across the entire API. This ensures
     * operations can be uniquely identified in generated SDKs and prevents
     * naming conflicts.
     */
    name: string & CamelPattern;

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
