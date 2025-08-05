import { AutoBeOpenApi } from "@autobe/interface";
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
     * Step 1: Strategic API operation design analysis and planning.
     *
     * AI analyzes the provided endpoint list, requirements documents, and Prisma
     * schemas to formulate a comprehensive API operation design strategy. This
     * planning phase is crucial for creating well-structured, RESTful operations
     * that align with business objectives and database design. The AI must
     * understand the purpose of each endpoint, its relationship to the database
     * entities, and appropriate request/response patterns before implementation.
     *
     * **Key Considerations:**
     *
     * - **Endpoint Analysis**: Understand each path/method combination purpose
     * - **Entity Mapping**: Connect operations to Prisma schema tables
     * - **RESTful Patterns**: Apply appropriate GET, POST, PUT, PATCH, DELETE patterns
     * - **Authorization Strategy**: Plan role-based access for each operation
     * - **Data Flow**: Design request/response bodies based on use cases
     * - **Naming Conventions**: Plan consistent DTO naming with service prefix
     *
     * Workflow: Endpoint analysis → Entity mapping → Operation pattern planning
     */
    thinking: string;

    /**
     * Step 2: Initial API operations implementation.
     *
     * AI generates the first working version of API operations based on the
     * strategic plan. This draft must be a complete array of IOperation objects
     * that implements all planned endpoints with specifications, descriptions,
     * parameters, and request/response body definitions. Each operation should
     * follow REST conventions while incorporating detailed business context from
     * Prisma schema comments.
     *
     * **Implementation Requirements:**
     *
     * - **Complete Coverage**: Every endpoint from the list as IOperation
     * - **Specification**: Clear business purpose and functionality
     * - **Description**: Multi-paragraph details referencing Prisma schemas
     * - **Parameters**: Accurate path parameter definitions
     * - **Request Bodies**: Appropriate DTO types for POST/PUT/PATCH
     * - **Response Bodies**: Correct response types with service prefix
     * - **Authorization**: Realistic role arrays for access control
     * - **Operation Names**: Consistent naming (index, at, search, create, update, erase)
     *
     * **Pattern Application:**
     *
     * - GET /entities: List operation with pagination response
     * - GET /entities/{id}: Detail retrieval with single entity response
     * - PATCH /entities: Complex search with request/response bodies
     * - POST /entities: Creation with .ICreate request type
     * - PUT /entities/{id}: Update with .IUpdate request type
     * - DELETE /entities/{id}: Deletion with no request/response body
     *
     * Workflow: Strategic plan → Operation implementation → Complete operations array
     */
    draft: IOperation[];

    /**
     * Step 3: API operations review and quality assessment.
     *
     * AI performs a thorough review of the draft operations implementation,
     * examining multiple quality dimensions to ensure production readiness.
     * This review process identifies issues, suggests improvements, and
     * validates compliance with REST standards and business requirements.
     *
     * **Review Dimensions:**
     *
     * **Operation Completeness:**
     *
     * - All endpoints from the list are implemented
     * - No missing or duplicate operations
     * - Consistent operation naming patterns
     *
     * **REST Compliance:**
     *
     * - Appropriate HTTP methods for operations
     * - Resource-centric URL patterns
     * - Proper use of path parameters vs request bodies
     * - Consistent response patterns (single vs paginated)
     *
     * **Description Quality (Per INTERFACE_OPERATION.md):**
     *
     * - Multi-paragraph descriptions with proper structure
     * - References to Prisma schema entity descriptions
     * - Security and authorization context included
     * - Business logic and validation rules explained
     * - Error scenarios and edge cases covered
     *
     * **Type Naming Validation:**
     *
     * - Service prefix correctly applied to all DTOs
     * - Consistent naming patterns (.ICreate, .IUpdate, .IRequest)
     * - Response types match operation patterns
     * - Pagination types for list operations
     *
     * **Authorization Assessment:**
     *
     * - Realistic role assignments based on operation type
     * - Public endpoints have empty role arrays
     * - Sensitive operations have appropriate restrictions
     * - Role names match database user types
     *
     * **Language Validation:**
     *
     * - ALL descriptions and summaries MUST be in English
     * - Check for any non-English text in specifications
     * - Identify any mixed-language content
     *
     * Workflow: Draft operations → Systematic review → Improvement recommendations
     */
    review: string;

    /**
     * Step 4: Final production-ready API operations.
     *
     * AI produces the final, polished version of API operations incorporating
     * all review feedback. This array of IOperation objects represents the
     * completed API specification, ready for schema generation and implementation.
     * All identified issues must be resolved, and operations must meet
     * enterprise-grade quality standards.
     *
     * **Final Operation Characteristics:**
     *
     * - **Complete Implementation**: All endpoints with no omissions
     * - **REST Best Practices**: Proper HTTP semantics and patterns
     * - **Detailed Documentation**: Comprehensive multi-paragraph descriptions
     * - **Accurate Parameters**: Path parameters match endpoint paths exactly
     * - **Consistent Types**: All DTOs follow service prefix naming convention
     * - **Appropriate Security**: Authorization roles reflect business requirements
     * - **English-Only Content**: All text fields in English
     * - **Business Alignment**: Operations match requirements and Prisma schemas
     *
     * **Quality Standards (Per INTERFACE_OPERATION.md):**
     *
     * - Specifications clearly explain business purpose
     * - Descriptions include multiple informative paragraphs
     * - Parameters have accurate names and descriptions
     * - Request/response bodies use correct type references
     * - Authorization roles are realistic and appropriate
     * - Operation names follow standard patterns
     *
     * **Language Requirements:**
     *
     * - If review identified non-English content, translate to English
     * - Maintain technical accuracy during translation
     * - Preserve detailed explanations and context
     *
     * Workflow: Review feedback → Issue resolution → Language correction → Production-ready operations
     *
     * This array serves as the definitive API operation specification for
     * the Interface Agent's schema generation process.
     */
    final: IOperation[];
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
    extends Omit<AutoBeOpenApi.IOperation, "authorizationRole"> {
    /**
     * Authorization roles required to access this API operation.
     *
     * This field specifies which user roles are allowed to access this
     * endpoint. Multiple roles can be specified to allow different types of
     * users to access the same endpoint.
     *
     * ## Important Guidelines
     *
     * - Set to empty array `[]` for public endpoints that require no
     *   authentication
     * - Set to array with role strings for role-restricted endpoints
     * - The role names MUST match exactly with the user type/role defined in the
     *   database
     * - This will be used by the Realize Agent to generate appropriate decorator
     *   and authorization logic in the provider functions
     * - The controller will apply the corresponding authentication decorator
     *   based on these roles
     *
     * ## Examples
     *
     * - `[]` - Public endpoint, no authentication required
     * - `["user"]` - Any authenticated user can access
     * - `["admin"]` - Only admin users can access
     * - `["admin", "moderator"]` - Both admin and moderator users can access
     * - `["seller"]` - Only seller users can access
     *
     * Note: The actual authentication/authorization implementation will be
     * handled by decorators at the controller level, and the provider function
     * will receive the authenticated user object with the appropriate type.
     */
    authorizationRoles: Array<string & tags.MinLength<1>>;
  }
}
