import { tags } from "typia";

import { CamelCasePattern } from "../typings/CamelCasePattern";

/**
 * AST type system for programmatic OpenAPI specification generation through AI
 * function calling.
 *
 * This namespace defines a comprehensive Abstract Syntax Tree structure that
 * enables AI agents to construct complete OpenAPI v3.1 specification documents
 * at the AST level. Each type corresponds to specific OpenAPI specification
 * constructs, allowing precise control over generated API documentation while
 * maintaining type safety and business logic accuracy.
 *
 * LANGUAGE REQUIREMENT: All description fields throughout this type system
 * (including operation descriptions, summaries, parameter descriptions, schema
 * descriptions, etc.) MUST be written exclusively in English. This is a strict
 * requirement for API documentation consistency and international
 * compatibility.
 *
 * ## Core Purpose
 *
 * The system is designed for systematic generation where AI function calls
 * build API specifications step-by-step, mapping business requirements to
 * executable OpenAPI documents. Instead of generating raw OpenAPI JSON/YAML
 * strings, AI agents construct structured AST objects that represent:
 *
 * - Complete REST API specifications with proper operation definitions
 * - Comprehensive type schemas aligned with database structures
 * - Detailed parameter and response body specifications
 * - Consistent naming conventions and documentation standards
 *
 * ## Architecture Overview
 *
 * - **IDocument**: Root container representing the entire OpenAPI specification
 * - **IOperation**: Individual API endpoints with HTTP methods, paths, and data
 *   structures
 * - **IComponents**: Reusable schema definitions and security configurations
 * - **IJsonSchema**: Type system following OpenAPI v3.1 JSON Schema specification
 * - **Parameters & Bodies**: Request/response structures with validation rules
 *
 * ## OpenAPI v3.1 Compliance
 *
 * This implementation follows the OpenAPI v3.1 specification but is streamlined
 * to:
 *
 * - Remove ambiguous and duplicated expressions for improved clarity
 * - Enhance AI generation capabilities through simplified type structures
 * - Maintain developer understanding with consistent patterns
 * - Support comprehensive API documentation with detailed descriptions
 *
 * ## Design Principles
 *
 * The generated specifications follow enterprise-grade patterns:
 *
 * - Consistent RESTful API design with standard HTTP methods
 * - Comprehensive CRUD operation coverage for all business entities
 * - Type-safe request/response schemas with validation constraints
 * - Detailed documentation with multi-paragraph descriptions
 * - Reusable component schemas for maintainability and consistency
 * - Security-aware design with authorization considerations
 *
 * Each generated OpenAPI document reflects real business workflows where API
 * operations provide complete access to underlying data models, maintain proper
 * REST conventions, and include comprehensive documentation suitable for
 * developer consumption and automated tooling integration.
 *
 * @author Samchon
 */
export namespace AutoBeOpenApi {
  /* -----------------------------------------------------------
    DOCUMENT
  ----------------------------------------------------------- */
  /**
   * Document of the Restful API operations.
   *
   * This interface serves as the root document for defining Restful API
   * {@link operations} and {@link components}. It corresponds to the top-level
   * structure of an OpenAPI specification document, containing all API
   * operations and reusable components.
   *
   * This simplified version focuses only on the operations and components,
   * omitting other OpenAPI elements like info, servers, security schemes, etc.
   * to keep the structure concise for AI-based code generation.
   *
   * IMPORTANT: When creating this document, you MUST ensure that:
   *
   * 1. The API operations and component schemas directly correspond to the
   *    database schema
   * 2. All entity types and their properties reference and incorporate the
   *    description comments from the related database schema tables and
   *    columns
   * 3. Descriptions are detailed and organized into multiple paragraphs
   * 4. The API fully represents all entities and relationships defined in the
   *    database schema
   * 5. EVERY SINGLE TABLE in the database schema MUST have corresponding API
   *    operations for CRUD actions (Create, Read, Update, Delete) as
   *    applicable
   * 6. NO TABLE should be omitted from the API design - all tables require API
   *    coverage
   *
   * ## Type Naming Conventions
   *
   * When defining component schemas, follow these naming conventions for
   * consistency:
   *
   * - **Main Entity Types**: Use `IEntityName` format for main entity with
   *   detailed information (e.g., `IShoppingSale`)
   *
   *   - These MUST directly correspond to entity tables in the database schema
   *   - Their descriptions MUST incorporate the table description comments from the
   *       database schema
   *   - Each property MUST reference the corresponding column description from the
   *       database schema
   *   - Entity types should represent the full, detailed version of domain entities
   * - **Related Operation Types**: Use `IEntityName.IOperation` format with these
   *   common suffixes:
   *
   *   - `IEntityName.ICreate`: Request body for creation operations (POST)
   *
   *       - Should include all required fields from the database schema entity
   *   - `IEntityName.IUpdate`: Request body for update operations (PUT)
   *
   *       - Should include updatable fields as defined in the database schema
   *   - `IEntityName.ISummary`: Simplified response version with essential
   *       properties
   *   - `IEntityName.IRequest`: Request parameters for list operations (often with
   *       search/pagination)
   *   - `IEntityName.IInvert`: Alternative view of an entity from a different
   *       perspective
   *   - `IPageIEntityName`: Paginated results container with `pagination` and
   *       `data` properties
   *
   * These consistent naming patterns create a predictable and self-documenting
   * API that accurately reflects the underlying database schema, making it
   * easier for developers to understand the purpose of each schema and its
   * relationship to the database model.
   */
  export interface IDocument {
    /**
     * List of API operations.
     *
     * This array contains all the API endpoints with their HTTP methods,
     * descriptions, parameters, request/response structures, etc. Each
     * operation corresponds to an entry in the paths section of an OpenAPI
     * document.
     *
     * CRITICAL: This array MUST include operations for EVERY TABLE defined in
     * the database schema. The AI generation MUST NOT skip or omit any tables
     * when creating operations. The operations array MUST be complete and
     * exhaustive, covering all database entities without exception.
     *
     * IMPORTANT: For each API operation, ensure that:
     *
     * 1. EVERY independent entity table in the database schema has corresponding
     *    API operations for basic CRUD functions (at minimum)
     * 2. ALL TABLES from the database schema MUST have at least one API operation,
     *    no matter how many tables are in the schema
     * 3. DO NOT STOP generating API operations until ALL tables have been
     *    addressed
     * 4. The description field refers to and incorporates the description comments
     *    from the related DB schema tables and columns
     * 5. The description must be VERY detailed and organized into MULTIPLE
     *    PARAGRAPHS separated by line breaks, not just a single paragraph
     * 6. The description should explain the purpose, functionality, and any
     *    relationships to other entities in the database schema
     *
     * Note that, combination of {@link AutoBeOpenApi.IOperation.path} and
     * {@link AutoBeOpenApi.IOperation.method} must be unique.
     *
     * Also, never forget any specification that is listed on the requirement
     * analysis report and DB design documents. Every feature must be
     * implemented in the API operations.
     *
     * @minItems 1
     */
    operations: AutoBeOpenApi.IOperation[];

    /**
     * Reusable components of the API operations.
     *
     * This contains schemas, parameters, responses, and other reusable elements
     * referenced throughout the API operations. It corresponds to the
     * components section in an OpenAPI document.
     *
     * CRITICAL: Components MUST include type definitions for EVERY TABLE in the
     * database schema. The AI generation process MUST create schema components
     * for ALL database entities without exception, regardless of how many
     * tables are in the database.
     *
     * IMPORTANT: For all component types and their properties:
     *
     * 1. EVERY component MUST have a detailed description that references the
     *    corresponding database schema table's description comments
     * 2. EACH property within component types MUST have detailed descriptions that
     *    reference the corresponding column description comments in the
     *    database schema
     * 3. All descriptions MUST be organized into MULTIPLE PARAGRAPHS (separated by
     *    line breaks) based on different aspects of the entity
     * 4. Descriptions should be comprehensive enough that anyone who reads them
     *    can understand the purpose, functionality, and relationships of the
     *    type
     * 5. ALL TABLES from the database schema MUST have corresponding schema
     *    components, no matter how many tables are in the schema
     *
     * All request and response bodies must reference named types defined in
     * this components section. This ensures consistency and reusability across
     * the API.
     *
     * ## Type Naming Conventions in Components
     *
     * When defining schema components, follow these standardized naming
     * patterns for consistency and clarity:
     *
     * ### Main Entity Types
     *
     * - `IEntityName`
     *
     *   - Primary entity objects (e.g., `IShoppingSale`, `IShoppingOrder`)
     *   - These represent the full, detailed version of domain entities
     *
     * ### Operation-Specific Types
     *
     * - `IEntityName.ICreate`
     *
     *   - Request body schemas for creation operations (POST)
     *   - Contains all fields needed to create a new entity
     * - `IEntityName.IUpdate`
     *
     *   - Request body schemas for update operations (PUT)
     *   - Contains fields that can be modified on an existing entity
     * - `IEntityName.IRequest`
     *
     *   - Parameters for search/filter/pagination in list operations
     *   - Often contains `search`, `sort`, `page`, and `limit` properties
     *
     * ### View Types
     *
     * - `IEntityName.ISummary`
     *
     *   - Simplified view of entities for list operations
     *   - Contains essential properties only, omitting detailed nested objects
     * - `IEntityName.IAbridge`: Intermediate view with more details than Summary
     *   but less than full entity
     * - `IEntityName.IInvert`: Alternative representation of an entity from a
     *   different perspective
     *
     * ### Container Types
     *
     * - `IPageIEntityName`
     *
     *   - Paginated results container
     *   - Usually contains `pagination` and `data` properties
     *
     * These naming conventions create a self-documenting API where the purpose
     * of each schema is immediately clear from its name. This helps both
     * developers and AI tools understand and maintain the API structure.
     */
    components: AutoBeOpenApi.IComponents;
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
   *       "responses": {...},
   *       ...
   *     }
   *   }
   * }
   * ```
   */
  export interface IOperation extends IEndpoint {
    /**
     * Implementation specification for the API operation.
     *
     * This is an AutoBE-internal field (not exposed in standard OpenAPI output)
     * that provides detailed implementation guidance for downstream agents
     * (Realize Agent, Test Agent, etc.).
     *
     * Include **HOW** this operation should be implemented:
     *
     * - Service layer logic and algorithm
     * - Database queries and transactions involved
     * - Business rules and validation logic
     * - Edge cases and error handling
     * - Integration with other services
     *
     * This field complements the `description` field: while `description` is
     * for API consumers (Swagger UI, SDK docs), `specification` is for agents
     * that implement the operation.
     *
     * > MUST be written in English. Never use other languages.
     */
    specification: string;

    /**
     * Detailed description about the API operation.
     *
     * IMPORTANT: This field MUST be extensively detailed and MUST reference the
     * description comments from the related database schema tables and columns.
     * The description should be organized into MULTIPLE PARAGRAPHS separated by
     * line breaks to improve readability and comprehension.
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
     * Authorization type of the API operation.
     *
     * - `"login"`: User login operations that validate credentials
     * - `"join"`: User registration operations that create accounts
     * - `"refresh"`: Token refresh operations that renew access tokens
     * - `null`: All other operations (CRUD, business logic, etc.)
     *
     * Use authentication values only for credential validation, user
     * registration, or token refresh operations. Use `null` for all other
     * business operations.
     *
     * Examples:
     *
     * - `/auth/login` → `"login"`
     * - `/auth/register` → `"join"`
     * - `/auth/refresh` → `"refresh"`
     * - `/auth/validate` → `null`
     * - `/users/{id}`, `/shoppings/customers/sales/cancel`, → `null`
     */
    authorizationType: "login" | "join" | "refresh" | null;

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
     * Authorization actor required to access this API operation.
     *
     * This field specifies which user actor is allowed to access this endpoint.
     * The actor name must correspond exactly to the actual actors defined in
     * your system's database schema.
     *
     * ## Naming Convention
     *
     * Actor names MUST use camelCase.
     *
     * ## Actor-Based Path Convention
     *
     * When authorizationActor is specified, it should align with the path
     * structure:
     *
     * - If authorizationActor is "admin" → path might be "/admin/resources/{id}"
     * - If authorizationActor is "seller" → path might be "/seller/products"
     * - Special case: For user's own resources, use path prefix "/my/" regardless
     *   of actor
     *
     * ## Important Guidelines
     *
     * - Set to `null` for public endpoints that require no authentication
     * - Set to specific actor string for actor-restricted endpoints
     * - The actor name MUST match exactly with the user type/actor defined in the
     *   database
     * - This actor will be used by the Realize Agent to generate appropriate
     *   decorator and authorization logic in the provider functions
     * - The controller will apply the corresponding authentication decorator
     *   based on this actor
     *
     * ## Examples
     *
     * - `null` - Public endpoint, no authentication required
     * - `"user"` - Any authenticated user can access
     * - `"admin"` - Only admin users can access
     * - `"seller"` - Only seller users can access
     * - `"moderator"` - Only moderator users can access
     *
     * Note: The actual authentication/authorization implementation will be
     * handled by decorators at the controller level, and the provider function
     * will receive the authenticated user object with the appropriate type.
     */
    authorizationActor: (string & CamelCasePattern & tags.MinLength<1>) | null;

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
    name: string & CamelCasePattern;

    /**
     * Prerequisites for this API operation.
     *
     * The `prerequisites` field defines API operations that must be
     * successfully executed before this operation can be performed. This
     * creates an explicit dependency chain between API endpoints, ensuring
     * proper execution order and data availability.
     *
     * ## CRITICAL WARNING: Authentication Prerequisites
     *
     * **NEVER include authentication-related operations as prerequisites!**
     * Authentication is handled separately through the `authorizationActor`
     * field and should NOT be part of the prerequisite chain. Do NOT add
     * prerequisites for:
     *
     * - Login endpoints
     * - Token validation endpoints
     * - User authentication checks
     * - Permission verification endpoints
     *
     * Prerequisites are ONLY for business logic dependencies, NOT for
     * authentication/authorization.
     *
     * ## Purpose and Use Cases
     *
     * Prerequisites are essential for operations that depend on:
     *
     * 1. **Existence Validation**: Ensuring resources exist before manipulation
     * 2. **State Requirements**: Verifying resources are in the correct state
     * 3. **Data Dependencies**: Loading necessary data for the current operation
     * 4. **Business Logic Constraints**: Enforcing domain-specific rules
     *
     * ## Execution Flow
     *
     * When an operation has prerequisites:
     *
     * 1. Each prerequisite API must be called first in the specified order
     * 2. Prerequisites must return successful responses (2xx status codes)
     * 3. Only after all prerequisites succeed can the main operation proceed
     * 4. If any prerequisite fails, the operation should not be attempted
     *
     * ## Common Patterns
     *
     * ### Resource Existence Check
     *
     * ```typescript
     * // Before updating an order item, ensure the order exists
     * prerequisites: [
     *   {
     *     endpoint: { path: "/orders/{orderId}", method: "get" },
     *     description: "Order must exist in the system",
     *   },
     * ];
     * ```
     *
     * ### State Validation
     *
     * ```typescript
     * // Before processing payment, ensure order is in correct state
     * prerequisites: [
     *   {
     *     endpoint: { path: "/orders/{orderId}/status", method: "get" },
     *     description: "Order must be in 'pending_payment' status",
     *   },
     * ];
     * ```
     *
     * ### Hierarchical Dependencies
     *
     * ```typescript
     * // Before accessing a deeply nested resource
     * prerequisites: [
     *   {
     *     endpoint: { path: "/projects/{projectId}", method: "get" },
     *     description: "Project must exist",
     *   },
     *   {
     *     endpoint: {
     *       path: "/projects/{projectId}/tasks/{taskId}",
     *       method: "get",
     *     },
     *     description: "Task must exist within the project",
     *   },
     * ];
     * ```
     *
     * ## Important Guidelines
     *
     * 1. **Order Matters**: Prerequisites are executed in array order
     * 2. **Parameter Inheritance**: Path parameters from prerequisites can be used
     *    in the main operation
     * 3. **Error Handling**: Failed prerequisites should prevent main operation
     * 4. **Performance**: Consider caching prerequisite results when appropriate
     * 5. **Documentation**: Each prerequisite must have a clear description
     *    explaining why it's required
     * 6. **No Authentication**: NEVER use prerequisites for authentication checks
     *
     * ## Test Generation Impact
     *
     * The Test Agent uses prerequisites to:
     *
     * - Generate proper test setup sequences
     * - Create valid test data in the correct order
     * - Ensure test scenarios follow realistic workflows
     * - Validate error handling when prerequisites fail
     *
     * @see {@link IPrerequisite} for the structure of each prerequisite
     */
    prerequisites: IPrerequisite[];

    /**
     * Accessor of the operation.
     *
     * If you configure this property, the assigned value will be used as
     * {@link IHttpMigrateRoute.accessor}. Also, it can be used as the
     * {@link IHttpLlmFunction.name} by joining with `.` character in the LLM
     * function calling application.
     *
     * Note that the `x-samchon-accessor` value must be unique in the entire
     * OpenAPI document operations. If there are duplicated `x-samchon-accessor`
     * values, {@link IHttpMigrateRoute.accessor} will ignore all duplicated
     * `x-samchon-accessor` values and generate the
     * {@link IHttpMigrateRoute.accessor} by itself.
     *
     * @internal
     */
    accessor?: string[] | undefined;
  }

  /**
   * Authorization - Authentication and user type information
   *
   * This field defines how the API authenticates the request and restricts
   * access to specific user types.
   *
   * ✅ Only the `Authorization` HTTP header is used for authentication. The
   * expected format is:
   *
   * Authorization: Bearer <access_token>
   *
   * The token must be a bearer token (e.g., JWT or similar), and when parsed,
   * it is guaranteed to include at least the authenticated actor's `id` field.
   * No other headers or cookie-based authentication methods are supported.
   */
  export interface IAuthorization {
    /**
     * Allowed user types for this API
     *
     * Specifies which user types are permitted to access this API.
     *
     * This is not a permission level or access control actor. Instead, it
     * describes **who** the user is — their type within the service's domain
     * model. It must correspond 1:1 with how the user is represented in the
     * database.
     *
     * MUST use camelCase naming convention.
     *
     * ⚠️ Important: Each `actor` must **exactly match a table name defined in
     * the database schema**. This is not merely a convention or example — it is
     * a strict requirement.
     *
     * A valid actor must meet the following criteria:
     *
     * - It must uniquely map to a user group at the database level, represented
     *   by a dedicated table.
     * - It must not overlap semantically with other actors — for instance, both
     *   `admin` and `administrator` must not exist to describe the same type.
     *
     * Therefore, if a user type cannot be clearly and uniquely distinguished in
     * the database, It **cannot** be used as a valid `actor` here.
     */
    name: string & CamelCasePattern;

    /**
     * Detailed description of the authorization actor
     *
     * Provides a comprehensive explanation of:
     *
     * - The purpose and scope of this authorization actor
     * - Which types of users are granted this actor
     * - What capabilities and permissions this actor enables
     * - Any constraints or limitations associated with the actor
     * - How this actor relates to the underlying database schema
     * - Examples of typical use cases for this actor
     *
     * This description should be detailed enough for both API consumers to
     * understand the actor's purpose and for the system to properly enforce
     * access controls.
     *
     * > MUST be written in English. Never use other languages.
     */
    description: string;
  }

  /**
   * Path parameter information for API routes.
   *
   * This interface defines a path parameter that appears in the URL of an API
   * endpoint. Path parameters are enclosed in curly braces in the
   * {@link AutoBeOpenApi.IOperation.path operation path} and must be defined
   * with their types and descriptions.
   *
   * For example, if API operation path is
   * `/shoppings/customers/sales/{saleId}/questions/${questionId}/comments/${commentId}`,
   * the path parameters should be like below:
   *
   * ```json
   * {
   *   "path": "/shoppings/customers/sales/{saleId}/questions/${questionId}/comments/${commentId}",
   *   "method": "get",
   *   "parameters": [
   *     {
   *       "name": "saleId",
   *       "in": "path",
   *       "schema": { "type": "string", "format": "uuid" },
   *       "description": "Target sale's ID"
   *     },
   *     {
   *       "name": "questionId",
   *       "in": "path",
   *       "schema": { "type": "string", "format": "uuid" },
   *       "description": "Target question's ID"
   *     },
   *     {
   *       "name": "commentId",
   *       "in": "path",
   *       "schema": { "type": "string", "format": "uuid" },
   *       "description": "Target comment's ID"
   *     }
   *   ]
   * }
   * ```
   */
  export interface IParameter {
    /**
     * Description about the path parameter.
     *
     * This is the standard OpenAPI description field that will be displayed in
     * Swagger UI, SDK documentation, and other API documentation tools. Write a
     * short, concise, and clear description that helps API consumers understand
     * what this parameter represents.
     *
     * Implementation details for parameter handling are covered in the parent
     * {@link IOperation.specification} field.
     *
     * > MUST be written in English. Never use other languages.
     */
    description: string;

    /**
     * Identifier name of the path parameter.
     *
     * This name must match exactly with the parameter name in the route path.
     * It must be corresponded to the
     * {@link AutoBeOpenApi.IOperation.path API operation path}.
     *
     * MUST use camelCase naming convention.
     */
    name: string & CamelCasePattern;

    /**
     * Type schema of the path parameter.
     *
     * Path parameters are typically primitive types like
     * {@link AutoBeOpenApi.IJsonSchema.IString strings},
     * {@link AutoBeOpenApi.IJsonSchema.IInteger integers},
     * {@link AutoBeOpenApi.IJsonSchema.INumber numbers}.
     *
     * If you need other types, please use request body instead with object type
     * encapsulation.
     */
    schema:
      | AutoBeOpenApi.IJsonSchema.IInteger
      | AutoBeOpenApi.IJsonSchema.INumber
      | AutoBeOpenApi.IJsonSchema.IString;
  }

  /**
   * Request body information of OpenAPI operation.
   *
   * This interface defines the structure for request bodies in API routes. It
   * corresponds to the requestBody section in OpenAPI specifications, providing
   * both a description and schema reference for the request payload.
   *
   * The content-type for all request bodies is always `application/json`. Even
   * when file uploading is required, don't use `multipart/form-data` or
   * `application/x-www-form-urlencoded` content types. Instead, just define an
   * URI string property in the request body schema.
   *
   * Note that, all body schemas must be transformable to a
   * {@link AutoBeOpenApi.IJsonSchema.IReference reference} type defined in the
   * {@link AutoBeOpenApi.IComponents.schemas components section} as an
   * {@link AutoBeOpenApi.IJsonSchema.IObject object} type.
   *
   * In OpenAPI, this might represent:
   *
   * ```json
   * {
   *   "requestBody": {
   *     "description": "Creation info of the order",
   *     "content": {
   *       "application/json": {
   *         "schema": {
   *           "$ref": "#/components/schemas/IShoppingOrder.ICreate"
   *         }
   *       }
   *     }
   *   }
   * }
   * ```
   */
  export interface IRequestBody {
    /**
     * Description about the request body.
     *
     * Make short, concise and clear description about the request body.
     *
     * > MUST be written in English. Never use other languages.
     */
    description: string;

    /**
     * Request body type name.
     *
     * This specifies the data structure expected in the request body, that will
     * be transformed to {@link AutoBeOpenApi.IJsonSchema.IReference reference}
     * type in the {@link AutoBeOpenApi.IComponents.schemas components section}
     * as an {@link AutoBeOpenApi.IJsonSchema.Object object} type.
     *
     * Here is the naming convention for the request body type:
     *
     * - `IEntityName.ICreate`: Request body for creation operations (POST)
     * - `IEntityName.IUpdate`: Request body for update operations (PUT)
     * - `IEntityName.IRequest`: Request parameters for list operations (often
     *   with search/pagination)
     *
     * What you write:
     *
     * ```json
     * {
     *   "typeName": "IShoppingOrder.ICreate"
     * }
     * ```
     *
     * Transformed to:
     *
     * ```json
     * {
     *   "schema": {
     *     "$ref": "#/components/schemas/IShoppingOrder.ICreate"
     *   }
     * }
     * ```
     */
    typeName: string;
  }

  /**
   * Response body information for OpenAPI operation.
   *
   * This interface defines the structure of a successful response from an API
   * operation. It provides a description of the response and a schema reference
   * to define the returned data structure.
   *
   * The content-type for all responses is always `application/json`. Even when
   * file downloading is required, don't use `application/octet-stream` or
   * `multipart/form-data` content types. Instead, just define an URI string
   * property in the response body schema.
   *
   * In OpenAPI, this might represent:
   *
   * ```json
   * {
   *   "responses": {
   *     "200": {
   *       "description": "Order information",
   *       "content": {
   *         "application/json": {
   *           "schema": { "$ref": "#/components/schemas/IShoppingOrder" }
   *         }
   *       }
   *     }
   *   }
   * }
   * ```
   */
  export interface IResponseBody {
    /**
     * Description about the response body.
     *
     * Make short, concise and clear description about the response body.
     *
     * > MUST be written in English. Never use other languages.
     */
    description: string;

    /**
     * Response body's data type.
     *
     * Specifies the structure of the returned data (response body), that will
     * be transformed to {@link AutoBeOpenApi.IJsonSchema.IReference} type in the
     * {@link AutoBeOpenApi.IComponents.schemas components section} as an
     * {@link AutoBeOpenApi.IJsonSchema.IObject object} type.
     *
     * Here is the naming convention for the response body type:
     *
     * - `IEntityName`: Main entity with detailed information (e.g.,
     *   `IShoppingSale`)
     * - `IEntityName.ISummary`: Simplified response version with essential
     *   properties
     * - `IEntityName.IInvert`: Alternative view of an entity from a different
     *   perspective
     * - `IPageIEntityName`: Paginated results container with `pagination` and
     *   `data` properties
     *
     * What you write:
     *
     * ```json
     * {
     *   "typeName": "IShoppingOrder"
     * }
     * ```
     *
     * Transformed to:
     *
     * ```json
     * {
     *   "schema": {
     *     "$ref": "#/components/schemas/IShoppingOrder"
     *   }
     * }
     * ```
     */
    typeName: string;
  }

  /* -----------------------------------------------------------
    JSON SCHEMA
  ----------------------------------------------------------- */
  /**
   * Reusable components in OpenAPI.
   *
   * A storage of reusable components in OpenAPI document.
   *
   * In other words, it is a storage of named DTO schemas and security schemes.
   */
  export interface IComponents {
    /**
     * An object to hold reusable DTO schemas.
     *
     * In other words, a collection of named JSON schemas.
     *
     * IMPORTANT: For each schema in this collection:
     *
     * 1. EVERY schema MUST have a detailed description that references and aligns
     *    with the description comments from the corresponding database schema
     *    tables
     * 2. EACH property within the schema MUST have detailed descriptions that
     *    reference and align with the description comments from the
     *    corresponding DB schema columns
     * 3. All descriptions MUST be organized into MULTIPLE PARAGRAPHS (separated by
     *    line breaks) when appropriate
     * 4. Descriptions should be comprehensive enough that anyone reading them can
     *    understand the purpose, functionality, and constraints of each type
     *    and property without needing to reference other documentation
     */
    schemas: Record<string, IJsonSchemaDescriptive>;

    /** Whether includes `Authorization` header or not. */
    authorizations: IAuthorization[];
  }

  /**
   * Type schema info.
   *
   * `AutoBeOpenApi.IJsonSchema` is a type schema info of the OpenAPI
   * Generative.
   *
   * `AutoBeOpenApi.IJsonSchema` basically follows the JSON schema specification
   * of OpenAPI v3.1, but a little bit shrunk to remove ambiguous and duplicated
   * expressions of OpenAPI v3.1 for the convenience, clarity, and AI
   * generation.
   *
   * ## CRITICAL: Union Type Expression
   *
   * In this type system, union types (including nullable types) MUST be
   * expressed using the `IOneOf` structure. NEVER use array notation in the
   * `type` field.
   *
   * ❌ **FORBIDDEN** - Array notation in type field:
   *
   * ```typescript
   * {
   *   "type": ["string", "null"] // NEVER DO THIS!
   * }
   * ```
   *
   * ✅ **CORRECT** - Using IOneOf for unions:
   *
   * ```typescript
   * // For nullable string:
   * {
   *   oneOf: [{ type: "string" }, { type: "null" }];
   * }
   *
   * // For string | number union:
   * {
   *   oneOf: [{ type: "string" }, { type: "number" }];
   * }
   * ```
   *
   * The `type` field in any schema object is a discriminator that identifies
   * the schema type and MUST contain exactly one string value.
   */
  export type IJsonSchema =
    | IJsonSchema.IConstant
    | IJsonSchema.IBoolean
    | IJsonSchema.IInteger
    | IJsonSchema.INumber
    | IJsonSchema.IString
    | IJsonSchema.IArray
    | IJsonSchema.IObject
    | IJsonSchema.IReference
    | IJsonSchema.IOneOf
    | IJsonSchema.INull;
  export namespace IJsonSchema {
    /** Constant value type. */
    export interface IConstant {
      /** The constant value. */
      const: boolean | number | string;
    }

    /** Boolean type info. */
    export interface IBoolean extends ISignificant<"boolean"> {}

    /** Integer type info. */
    export interface IInteger extends ISignificant<"integer"> {
      /**
       * Minimum value restriction.
       *
       * @type int64
       */
      minimum?: number;

      /**
       * Maximum value restriction.
       *
       * @type int64
       */
      maximum?: number;

      /**
       * Exclusive minimum value restriction.
       *
       * @type int64
       */
      exclusiveMinimum?: number;

      /**
       * Exclusive maximum value restriction.
       *
       * @type int64
       */
      exclusiveMaximum?: number;

      /**
       * Multiple of value restriction.
       *
       * @type uint64
       * @exclusiveMinimum 0
       */
      multipleOf?: number;
    }

    /** Number (double) type info. */
    export interface INumber extends ISignificant<"number"> {
      /** Minimum value restriction. */
      minimum?: number;

      /** Maximum value restriction. */
      maximum?: number;

      /** Exclusive minimum value restriction. */
      exclusiveMinimum?: number;

      /** Exclusive maximum value restriction. */
      exclusiveMaximum?: number;

      /**
       * Multiple of value restriction.
       *
       * @exclusiveMinimum 0
       */
      multipleOf?: number;
    }

    /** String type info. */
    export interface IString extends ISignificant<"string"> {
      /** Format restriction. */
      format?:
        | "password"
        | "regex"
        | "uuid"
        | "email"
        | "hostname"
        | "idn-email"
        | "idn-hostname"
        | "iri"
        | "iri-reference"
        | "ipv4"
        | "ipv6"
        | "uri"
        | "uri-reference"
        | "uri-template"
        | "url"
        | "date-time"
        | "date"
        | "time"
        | "duration"
        | "json-pointer"
        | "relative-json-pointer";

      /** Pattern restriction. */
      pattern?: string;

      /**
       * Content media type restriction.
       *
       * If you want to accept multiple contentMediaType values simultaneously
       * (e.g., `text/plain` and `text/html`), you MUST NOT violate the type by
       * using an array. Instead, use `oneOf` to define multiple `string`
       * schemas with different `contentMediaType` values.
       *
       * Example for accepting both text/plain and text/html:
       *
       * ```typescript
       * {
       *   "oneOf": [
       *     { "type": "string", "contentMediaType": "text/plain" },
       *     { "type": "string", "contentMediaType": "text/html" }
       *   ]
       * }
       * ```
       *
       * This is the CORRECT approach. Never use array notation or modify the
       * single string type to accept arrays.
       */
      contentMediaType?: string;

      /**
       * Minimum length restriction.
       *
       * @type uint64
       */
      minLength?: number;

      /**
       * Maximum length restriction.
       *
       * @type uint64
       */
      maxLength?: number;
    }

    /** Array type info. */
    export interface IArray extends ISignificant<"array"> {
      /**
       * Items type info.
       *
       * The `items` means the type of the array elements. In other words, it is
       * the type schema info of the `T` in the TypeScript array type
       * `Array<T>`.
       */
      items: Exclude<IJsonSchema, IJsonSchema.IObject>;

      /**
       * Unique items restriction.
       *
       * If this property value is `true`, target array must have unique items.
       */
      uniqueItems?: boolean;

      /**
       * Minimum items restriction.
       *
       * Restriction of minimum number of items in the array.
       *
       * @type uint64
       */
      minItems?: number;

      /**
       * Maximum items restriction.
       *
       * Restriction of maximum number of items in the array.
       *
       * @type uint64
       */
      maxItems?: number;
    }

    /** Object type info. */
    export interface IObject extends ISignificant<"object"> {
      /**
       * Target database table that this DTO object represents.
       *
       * Establishes a direct link between this DTO schema and a specific
       * database table. This mapping is critical for:
       *
       * - Property validation: Verifying DTO properties exist in the table
       * - Code generation: Generating correct database queries and selects
       * - Type consistency: Ensuring DTO structure aligns with database schema
       *
       * ## When to Set a Table Name
       *
       * Set this to a valid table name when the DTO directly represents or
       * derives from a specific database table:
       *
       * - Entity types (`IUser`, `IOrder`): Map to their primary table
       * - Summary types (`IUser.ISummary`): Map to the same table as parent
       * - Create/Update DTOs (`IUser.ICreate`): Map to the target table
       *
       * ## When to Set `null`
       *
       * Set this to `null` when the DTO has no direct database table mapping.
       * Common cases include:
       *
       * 1. **Composite/Aggregated types**: DTOs that combine data from multiple
       *    tables (e.g., `IDashboardSummary` aggregating user, order, and
       *    product statistics)
       * 2. **Request parameter types**: Search filters, pagination options,
       *    sorting criteria (e.g., `IUser.IRequest`, `IPageInfo`)
       * 3. **Computed result types**: DTOs representing calculation outputs (e.g.,
       *    `IRevenueReport`, `IAnalyticsResult`)
       * 4. **Wrapper types**: Container types for API responses (e.g., `IPage<T>`,
       *    `IApiResponse<T>`)
       * 5. **Pure business logic types**: DTOs born from requirements, not
       *    database structure (e.g., `ICheckoutSession`, `IPaymentIntent`)
       *
       * ## Critical Requirement When `null`
       *
       * When this field is `null`, the `x-autobe-specification` field (in
       * {@link IJsonSchemaDescriptive.IObject}) MUST contain detailed
       * implementation instructions:
       *
       * - Source tables and columns involved
       * - Join conditions between tables
       * - Aggregation formulas (`SUM`, `COUNT`, `AVG`, etc.)
       * - Business rules and transformation logic
       * - Edge cases (nulls, empty sets, defaults)
       *
       * **CRITICAL**: When set, the table name MUST be an actually existing
       * model name from the loaded database schema. Never guess or invent
       * schema names. Using non-existent schema names causes compilation
       * failures and pipeline breakdown.
       */
      "x-autobe-database-schema"?: string | null;

      /**
       * Properties of the object.
       *
       * The `properties` means a list of key-value pairs of the object's
       * regular properties. The key is the name of the regular property, and
       * the value is the type schema info.
       *
       * IMPORTANT: Each property in this object MUST have a detailed
       * description that references and aligns with the description comments
       * from the corresponding database schema column.
       *
       * If you need additional properties that is represented by dynamic key,
       * you can use the {@link additionalProperties} instead.
       */
      properties: Record<string, IJsonSchemaProperty>;

      /**
       * Additional properties' info.
       *
       * The `additionalProperties` means the type schema info of the additional
       * properties that are not listed in the {@link properties}.
       *
       * If the value is `false`, it means that the additional properties are
       * not specified. Otherwise, if the value is {@link IJsonSchema} type, it
       * means that the additional properties must follow the type schema info.
       *
       * - `false`: No additional properties
       * - `IJsonSchema`: `Record<string, T>`
       */
      additionalProperties?: false | Exclude<IJsonSchema, IJsonSchema.IObject>;

      /**
       * List of key values of the required properties.
       *
       * The `required` means a list of the key values of the required
       * {@link properties}. If some property key is not listed in the `required`
       * list, it means that property is optional. Otherwise some property key
       * exists in the `required` list, it means that the property must be
       * filled.
       *
       * Below is an example of the {@link properties} and `required`.
       *
       * ```typescript
       * interface SomeObject {
       *   id: string;
       *   email: string;
       *   name?: string;
       * }
       * ```
       *
       * As you can see, `id` and `email` {@link properties} are {@link required},
       * so that they are listed in the `required` list.
       *
       * ```json
       * {
       *   "type": "object",
       *   "properties": {
       *     "id": { "type": "string" },
       *     "email": { "type": "string" },
       *     "name": { "type": "string" }
       *   },
       *   "required": ["id", "email"]
       * }
       * ```
       */
      required: string[];
    }

    /** Reference type directing named schema. */
    export interface IReference {
      /**
       * Reference to the named schema.
       *
       * The `ref` is a reference to the named schema. Format of the `$ref` is
       * following the JSON Pointer specification. In the OpenAPI, the `$ref`
       * starts with `#/components/schemas/` which means the type is stored in
       * the {@link AutoBeOpenApi.IComponents.schemas} object.
       *
       * - `#/components/schemas/SomeObject`
       * - `#/components/schemas/AnotherObject`
       */
      $ref: string;
    }

    /**
     * Union type.
     *
     * `IOneOf` represents an union type of the TypeScript (`A | B | C`).
     *
     * For reference, even though your Swagger (or OpenAPI) document has defined
     * `anyOf` instead of the `oneOf`, {@link AutoBeOpenApi} forcibly converts it
     * to `oneOf` type.
     */
    export interface IOneOf {
      /** List of the union types. */
      oneOf: Exclude<IJsonSchema, IJsonSchema.IOneOf | IJsonSchema.IObject>[];

      /** Discriminator info of the union type. */
      discriminator?: IOneOf.IDiscriminator;
    }
    export namespace IOneOf {
      /** Discriminator info of the union type. */
      export interface IDiscriminator {
        /** Property name for the discriminator. */
        propertyName: string;

        /**
         * Mapping of the discriminator value to the schema name.
         *
         * This property is valid only for {@link IReference} typed
         * {@link IOneOf.oneof} elements. Therefore, `key` of `mapping` is the
         * discriminator value, and `value` of `mapping` is the schema name like
         * `#/components/schemas/SomeObject`.
         */
        mapping?: Record<string, string>;
      }
    }

    /** Null type. */
    export interface INull extends ISignificant<"null"> {}

    interface ISignificant<Type extends string> {
      /**
       * Discriminator value of the type.
       *
       * CRITICAL: This MUST be a SINGLE string value, NOT an array. The type
       * field identifies the JSON Schema type and must be exactly one of:
       * "boolean", "integer", "number", "string", "array", "object", or
       * "null".
       *
       * ❌ INCORRECT: type: ["string", "null"] // This is WRONG! ✅ CORRECT:
       * type: "string" // For nullable string, use oneOf instead
       *
       * If you need to express a nullable type (e.g., string | null), you MUST
       * use the `IOneOf` structure:
       *
       * ```typescript
       * {
       *   "oneOf": [{ "type": "string" }, { "type": "null" }]
       * }
       * ```
       *
       * NEVER use array notation in the type field. The type field is a
       * discriminator that accepts only a single string value.
       */
      type: Type;
    }
  }

  /**
   * Descriptive type schema info with required documentation.
   *
   * `AutoBeOpenApi.IJsonSchemaDescriptive` extends the base JSON schema types
   * with a required `description` field for API documentation. For object
   * types, it also includes an `x-autobe-specification` field for
   * implementation guidance.
   *
   * ## Type Construction Order
   *
   * When constructing types, fields MUST be specified in this order:
   *
   * 1. `x-autobe-specification` → HOW to implement this type
   * 2. `description` → WHAT for API consumers
   * 3. Type metadata (type, properties, etc.) → WHAT technically
   *
   * ## Two-Field Documentation Pattern
   *
   * This type system separates concerns between two documentation fields:
   *
   * - **`description`**: Standard OpenAPI field for API consumers. Displayed in
   *   Swagger UI, SDK docs, etc. Focuses on WHAT and WHY.
   * - **`x-autobe-specification`**: AutoBE-internal field for implementation
   *   agents. Focuses on HOW to implement.
   *
   * ## Guidelines for `description`
   *
   * - Reference the corresponding database schema documentation
   * - Organize into multiple paragraphs for complex types
   * - Focus on business meaning, relationships, and constraints
   * - Keep accessible to API consumers (no implementation details)
   *
   * ## Guidelines for `x-autobe-specification` (Object Types)
   *
   * - Provide precise implementation instructions
   * - Include source tables, join conditions, aggregation formulas
   * - Document edge cases and business rules
   * - Must be detailed enough for Realize Agent to implement
   */
  export type IJsonSchemaDescriptive =
    | IJsonSchemaDescriptive.IConstant
    | IJsonSchemaDescriptive.IBoolean
    | IJsonSchemaDescriptive.IInteger
    | IJsonSchemaDescriptive.INumber
    | IJsonSchemaDescriptive.IString
    | IJsonSchemaDescriptive.IArray
    | IJsonSchemaDescriptive.IObject
    | IJsonSchemaDescriptive.IReference
    | IJsonSchemaDescriptive.IOneOf
    | IJsonSchemaDescriptive.INull;
  export namespace IJsonSchemaDescriptive {
    /** Constant value type. */
    export interface IConstant extends IDescriptive, IJsonSchema.IConstant {}

    /** Boolean type info. */
    export interface IBoolean extends IDescriptive, IJsonSchema.IBoolean {}

    /** Integer type info. */
    export interface IInteger extends IDescriptive, IJsonSchema.IInteger {}

    /** Number (double) type info. */
    export interface INumber extends IDescriptive, IJsonSchema.INumber {}

    /** String type info. */
    export interface IString extends IDescriptive, IJsonSchema.IString {}

    /** Array type info. */
    export interface IArray extends IDescriptive, IJsonSchema.IArray {}

    /**
     * Object type info with implementation specification.
     *
     * This interface extends the base object schema with an additional
     * `x-autobe-specification` field that separates API documentation from
     * implementation details.
     *
     * ## Field Responsibilities
     *
     * - **`description`**: API documentation for consumers. Explains WHAT the
     *   type represents and WHY it exists. Displayed in Swagger UI and SDK
     *   docs.
     * - **`x-autobe-specification`**: Implementation guidance for agents.
     *   Explains HOW to implement data retrieval, computation, or
     *   transformation logic.
     *
     * ## When `x-autobe-database-schema` is `null`
     *
     * The `x-autobe-specification` MUST contain detailed implementation
     * instructions:
     *
     * - Source tables and columns involved
     * - Join conditions between tables
     * - Aggregation formulas (`SUM`, `COUNT`, `AVG`, etc.)
     * - Business rules and transformation logic
     * - Edge cases (nulls, empty sets, defaults)
     */
    export interface IObject extends IDescriptive, IJsonSchema.IObject {}

    /** Reference type directing named schema. */
    export interface IReference extends IDescriptive, IJsonSchema.IReference {}

    /**
     * Union type.
     *
     * `IOneOf` represents an union type of the TypeScript (`A | B | C`).
     *
     * For reference, even though your Swagger (or OpenAPI) document has defined
     * `anyOf` instead of the `oneOf`, {@link AutoBeOpenApi} forcibly converts it
     * to `oneOf` type.
     */
    export interface IOneOf extends IDescriptive, IJsonSchema.IOneOf {}

    /** Null type. */
    export interface INull extends IDescriptive, IJsonSchema.INull {}

    interface IDescriptive {
      /**
       * Implementation specification for this type.
       *
       * This is an AutoBE-internal field (not exposed in standard OpenAPI
       * output) that provides detailed implementation guidance for downstream
       * agents (Realize Agent, Test Agent, etc.).
       *
       * Include **HOW** this type should be implemented:
       *
       * - Source database tables (primary table and joined tables)
       * - Overall query strategy (joins, filters, grouping)
       * - Aggregation formulas if applicable (`SUM`, `COUNT`, `AVG`, etc.)
       * - Business rules and transformation logic
       * - Edge cases (nulls, empty sets, defaults)
       *
       * This field is especially critical when `x-autobe-database-schema` is
       * `null` (for composite, computed, or request parameter types), as it
       * provides the only guidance for implementing data retrieval or
       * computation logic.
       *
       * > MUST be written in English. Never use other languages.
       */
      "x-autobe-specification": string;

      /**
       * API documentation for the type.
       *
       * This is the standard OpenAPI description field that will be displayed
       * in Swagger UI, SDK documentation, and other API documentation tools.
       * Focus on explaining the type from an API consumer's perspective.
       *
       * The description SHOULD be organized into MULTIPLE PARAGRAPHS (separated
       * by line breaks) covering:
       *
       * - **WHAT**: The purpose and business meaning of the type
       * - **WHY**: When and why this type is used
       * - **Relationships**: Connections to other entities in the system
       * - **Constraints**: Validation rules visible to API consumers
       *
       * ## Important Notes
       *
       * - Reference the corresponding database schema table's documentation to
       *   maintain consistency
       * - Do NOT include implementation details here (use
       *   `x-autobe-specification` for object types)
       * - Keep the language accessible to API consumers who may not know the
       *   internal implementation
       *
       * > MUST be written in English. Never use other languages.
       */
      description: string;
    }
  }

  /**
   * Type schema for object properties with implementation specifications.
   *
   * `IJsonSchemaProperty` extends the base JSON Schema types with
   * implementation specifications. Each property in an
   * {@link IJsonSchema.IObject object schema} uses this type.
   *
   * ## Property Construction Order
   *
   * When constructing properties, fields MUST be specified in this order:
   *
   * 1. `x-autobe-specification` → HOW to implement/compute this property
   * 2. `description` → WHAT for API consumers
   * 3. Type metadata (type, format, etc.) → WHAT technically
   *
   * ## Two-Field Documentation Pattern
   *
   * Each property includes:
   *
   * - **`x-autobe-specification`**: Implementation guidance for agents
   * - **`description`**: API documentation for consumers (Swagger UI, SDK docs)
   *
   * ## Key Difference from IJsonSchemaDescriptive
   *
   * While {@link IJsonSchemaDescriptive} is used for top-level component schemas
   * (types in `components.schemas`), `IJsonSchemaProperty` is used for
   * properties within those schemas.
   *
   * ## Type Exclusions
   *
   * Note that `IJsonSchemaProperty` excludes `IObject` - object-typed
   * properties must use `IReference` to reference named schemas in the
   * components section. This prevents inline object definitions and ensures all
   * complex types are properly named and reusable.
   *
   * @see {@link IJsonSchemaProperty.IProperty} for property metadata details
   * @see {@link IJsonSchema.IObject} for object schemas that contain these properties
   */
  export type IJsonSchemaProperty =
    | IJsonSchemaProperty.IConstant
    | IJsonSchemaProperty.IBoolean
    | IJsonSchemaProperty.IInteger
    | IJsonSchemaProperty.INumber
    | IJsonSchemaProperty.IString
    | IJsonSchemaProperty.IArray
    | IJsonSchemaProperty.IReference
    | IJsonSchemaProperty.IOneOf
    | IJsonSchemaProperty.INull;
  export namespace IJsonSchemaProperty {
    /** Constant value property. */
    export interface IConstant extends IProperty, IJsonSchema.IConstant {}

    /** Boolean property. */
    export interface IBoolean extends IProperty, IJsonSchema.IBoolean {}

    /** Integer property. */
    export interface IInteger extends IProperty, IJsonSchema.IInteger {}

    /** Number (double) property. */
    export interface INumber extends IProperty, IJsonSchema.INumber {}

    /** String property. */
    export interface IString extends IProperty, IJsonSchema.IString {}

    /** Array property. */
    export interface IArray extends IProperty, IJsonSchema.IArray {}

    /**
     * Reference property.
     *
     * Used when a property references another named schema. The `$ref` points
     * to the related entity type (e.g., `IUser.ISummary`).
     */
    export interface IReference extends IProperty, IJsonSchema.IReference {}

    /** Union type property. */
    export interface IOneOf extends IProperty, IJsonSchema.IOneOf {}

    /** Null type property. */
    export interface INull extends IProperty, IJsonSchema.INull {}

    /**
     * Property-level metadata for DTO schema properties.
     *
     * This interface provides two documentation fields for each property:
     *
     * - **`x-autobe-specification`**: Implementation guidance for agents
     * - **`description`**: API documentation for consumers
     *
     * ## Property Construction Order
     *
     * When constructing properties, fields MUST be specified in this order:
     *
     * 1. `x-autobe-specification` → HOW to implement/compute this property
     * 2. `description` → WHAT for API consumers
     * 3. Type metadata (type, format, etc.) → WHAT technically
     *
     * ## Field Responsibilities
     *
     * | Field                    | Audience      | Content                      |
     * | ------------------------ | ------------- | ---------------------------- |
     * | `x-autobe-specification` | Agents        | HOW - implementation details |
     * | `description`            | API consumers | WHAT/WHY - business meaning  |
     */
    interface IProperty {
      /** @internal */
      "x-autobe-database-schema-property"?: string | null | undefined;

      /**
       * Implementation specification for this property.
       *
       * This is an AutoBE-internal field (not exposed in standard OpenAPI
       * output) that provides detailed implementation guidance for downstream
       * agents (Realize Agent, Test Agent, etc.).
       *
       * Include **HOW** this property value should be retrieved or computed:
       *
       * - Source database column or related table
       * - Any transformation logic between DB and DTO (e.g., type casting,
       *   formatting)
       * - Computation formula for derived values (e.g., `price * quantity`)
       * - Join conditions if data comes from related tables
       * - Validation rules enforced at the service layer
       * - Edge cases (nulls, defaults, empty values)
       *
       * The specification must be precise enough for Realize Agent to implement
       * the data retrieval or computation logic without ambiguity.
       *
       * > MUST be written in English. Never use other languages.
       */
      "x-autobe-specification": string;

      /**
       * API documentation for the property.
       *
       * This is the standard OpenAPI description field that will be displayed
       * in Swagger UI, SDK documentation, and other API documentation tools.
       * Focus on explaining the property from an API consumer's perspective.
       *
       * ## Content Guidelines
       *
       * - **WHAT**: What this property represents in the business domain
       * - **WHY**: Why this property exists and when it's used
       * - **Constraints**: Validation rules, value ranges, or format requirements
       *   visible to API consumers
       * - **Relationships**: If referencing another entity, explain the semantic
       *   relationship
       *
       * ## For Nullability Mismatch (DB non-null → DTO nullable/optional)
       *
       * When the database column is non-null but the DTO property is nullable
       * or optional, briefly explain why:
       *
       * - "Optional - defaults to 'user' if not provided."
       * - "Optional - server generates UUID if not provided."
       * - "Optional for update operations."
       *
       * ## Format Requirements
       *
       * - MUST be written in English
       * - Should be organized into multiple paragraphs for complex properties
       * - Use clear, precise language accessible to API consumers
       * - Do NOT include implementation details (use `x-autobe-specification`)
       */
      description: string;
    }
  }

  /* -----------------------------------------------------------
    BACKGROUNDS
  ----------------------------------------------------------- */
  /** API endpoint information. */
  export interface IEndpoint {
    /**
     * HTTP path of the API operation.
     *
     * The URL path for accessing this API operation, using path parameters
     * enclosed in curly braces (e.g., `/shoppings/customers/sales/{saleId}`).
     *
     * It must be corresponded to the {@link parameters path parameters}.
     *
     * The path structure should clearly indicate which database entity this
     * operation is manipulating, helping to ensure all entities have
     * appropriate API coverage.
     *
     * Path validation rules:
     *
     * - Must start with a forward slash (/)
     * - Can contain only: letters (a-z, A-Z), numbers (0-9), forward slashes (/),
     *   curly braces for parameters ({paramName}), hyphens (-), and underscores
     *   (_)
     * - Parameters must be enclosed in curly braces: {paramName}
     * - Resource names should be in camelCase
     * - No quotes, spaces, or invalid special characters allowed
     * - No domain or role-based prefixes
     *
     * Valid examples:
     *
     * - "/users"
     * - "/users/{userId}"
     * - "/articles/{articleId}/comments"
     * - "/attachmentFiles"
     * - "/orders/{orderId}/items/{itemId}"
     *
     * Invalid examples:
     *
     * - "'/users'" (contains quotes)
     * - "/user profile" (contains space)
     * - "/users/[userId]" (wrong bracket format)
     * - "/admin/users" (role prefix)
     * - "/api/v1/users" (API prefix)
     */
    path: string & tags.Pattern<"^\\/[a-zA-Z0-9\\/_{}.-]*$">;

    /**
     * HTTP method of the API operation.
     *
     * **IMPORTANT**: Methods must be written in lowercase only (e.g., "get",
     * not "GET").
     *
     * Note that, if the API operation has {@link requestBody}, method must not
     * be `get`.
     *
     * Also, even though the API operation has been designed to only get
     * information, but it needs complicated request information, it must be
     * defined as `patch` method with {@link requestBody} data specification.
     *
     * - `get`: get information
     * - `patch`: get information with complicated request data
     *   ({@link requestBody})
     * - `post`: create new record
     * - `put`: update existing record
     * - `delete`: remove record
     */
    method: "get" | "post" | "put" | "delete" | "patch";
  }

  /**
   * Prerequisite API operation dependency.
   *
   * `IPrerequisite` defines a dependency relationship between API operations,
   * specifying that certain endpoints must be successfully called before the
   * current operation can proceed. This ensures proper resource validation,
   * state checking, and data availability in complex API workflows.
   *
   * ## CRITICAL WARNING: Authentication is NOT a Prerequisite
   *
   * **NEVER use prerequisites for authentication or authorization checks!**
   *
   * Prerequisites are ONLY for business logic dependencies such as:
   *
   * - Checking if a resource exists
   * - Verifying resource state
   * - Loading required data
   *
   * Do NOT create prerequisites for:
   *
   * - Login/authentication endpoints
   * - Token validation
   * - Permission checks
   * - User authorization verification
   *
   * Authentication is handled separately via the `authorizationActor` field on
   * the operation itself. Mixing authentication with business prerequisites
   * creates confusion and incorrect test scenarios.
   *
   * ## Core Concept
   *
   * Prerequisites create an execution dependency graph for API operations. They
   * explicitly declare which APIs must succeed before attempting the current
   * operation, preventing invalid states and ensuring data consistency.
   *
   * ## Structure
   *
   * Each prerequisite consists of:
   *
   * 1. **endpoint**: The API endpoint that must be called first
   * 2. **description**: Clear explanation of why this prerequisite is required
   *
   * ## Common Use Cases
   *
   * ### 1. Resource Existence Validation
   *
   * ```typescript
   * {
   *   "endpoint": { "path": "/users/{userId}", "method": "get" },
   *   "description": "User must exist before updating their profile"
   * }
   * ```
   *
   * ### 2. Parent-Child Relationships
   *
   * ```typescript
   * {
   *   "endpoint": { "path": "/posts/{postId}", "method": "get" },
   *   "description": "Post must exist before adding comments"
   * }
   * ```
   *
   * ### 3. State Prerequisites
   *
   * ```typescript
   * {
   *   "endpoint": { "path": "/orders/{orderId}/status", "method": "get" },
   *   "description": "Order must be in 'confirmed' state before shipping"
   * }
   * ```
   *
   * ### 4. Business Logic Dependencies
   *
   * ```typescript
   * {
   *   "endpoint": {
   *     "path": "/inventory/{productId}/stock",
   *     "method": "get"
   *   },
   *   "description": "Product must have sufficient stock before creating order"
   * }
   * ```
   *
   * ## Implementation Guidelines
   *
   * 1. **Clear Descriptions**: Always explain WHY the prerequisite is needed
   * 2. **Minimal Dependencies**: Only include truly necessary prerequisites
   * 3. **Logical Order**: If multiple prerequisites exist, order them logically
   * 4. **Error Context**: Description should help understand failure scenarios
   * 5. **No Authentication**: Prerequisites must NEVER be authentication checks
   *
   * ## Test Generation Usage
   *
   * The Test Agent utilizes prerequisites to:
   *
   * - Set up test data in the correct sequence
   * - Generate realistic test scenarios
   * - Create both positive and negative test cases
   * - Ensure proper cleanup in reverse dependency order
   *
   * ## Best Practices
   *
   * - Keep prerequisite chains as short as possible for performance
   * - Consider caching prerequisite results when safe to do so
   * - Ensure prerequisite descriptions are specific, not generic
   * - Validate that circular dependencies don't exist
   * - Document any side effects of prerequisite calls
   * - NEVER use for authentication/authorization validation
   */
  export interface IPrerequisite {
    /**
     * The API endpoint that must be called before the main operation.
     *
     * This specifies the exact HTTP method and path of the prerequisite API.
     * The endpoint must be a valid operation defined elsewhere in the API
     * specification. Path parameters in the prerequisite endpoint can reference
     * the same parameters available in the main operation.
     */
    endpoint: IEndpoint;

    /**
     * Clear description of why this prerequisite is required.
     *
     * This description should explain:
     *
     * - What validation or check this prerequisite performs
     * - What state or condition must be satisfied
     * - What happens if this prerequisite fails
     * - Any specific data from the prerequisite used by the main operation
     *
     * The description helps developers understand the dependency relationship
     * and aids in debugging when prerequisites fail.
     *
     * Guidelines for good descriptions:
     *
     * - Be specific about the requirement (e.g., "must be in 'active' state")
     * - Explain business logic constraints (e.g., "budget must not be exceeded")
     * - Explain data dependencies (e.g., "provides pricing information needed")
     * - Keep it concise but complete
     *
     * > MUST be written in English. Never use other languages.
     */
    description: string;
  }
}
