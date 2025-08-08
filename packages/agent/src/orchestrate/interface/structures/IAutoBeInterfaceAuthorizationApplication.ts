import { AutoBeOpenApi } from "@autobe/interface";
import { tags } from "typia";

export interface IAutoBeInterfaceAuthorizationApplication {
  /**
   * Creates an authorization Operations for the given roles
   *
   * This method generates an OpenAPI interface that defines the authorization
   * requirements for the given roles. It ensures that the interface reflects
   * the correct permissions and access levels for each role.
   */
  makeOperations(props: IAutoBeInterfaceAuthorizationApplication.IProps): void;
}

export namespace IAutoBeInterfaceAuthorizationApplication {
  export interface IProps {
    /**
     * Array of API operations to generate authorization operation for.
     *
     * Each operation in this array must include:
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
     * All operations must follow strict quality standards:
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
    operations: AutoBeOpenApi.IOperation[] & tags.MinItems<1>;
  }
}
