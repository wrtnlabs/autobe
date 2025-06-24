import { AutoBeOpenApi } from "../openapi";

export namespace IAutoBeTestProgress {
  export interface IProgress {
    /**
     * The generated test code file containing the implementation.
     *
     * This property holds the complete test code that has been automatically
     * generated based on the test plan specifications.
     */
    file: IFile;
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
     */
    path: string;

    /**
     * HTTP method of the API operation.
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

    /**
     * A list of other API endpoints that must be executed before this test
     * scenario. This helps express dependencies such as data creation or
     * authentication steps required to reach the intended test state.
     */
    dependsOn: AutoBeOpenApi.IEndpoint[];
  }

  /**
   * Represents a generated test code file.
   *
   * This interface defines the structure of a test code file that has been
   * automatically generated based on the test plan specifications. It includes
   * the complete test code implementation, including all necessary test cases,
   * assertions, and setup code required to validate the API endpoint behavior.
   */
  export interface IFile {
    /**
     * Name of the test file that has been completed.
     *
     * Specifies the filename of the TypeScript test file that was just
     * generated, which contains standalone functions implementing specific use
     * case scenarios for particular API endpoints. The filename provides
     * context about which part of the API functionality is being validated by
     * this test file.
     */
    filename: string;

    /**
     * Complete TypeScript E2E test implementation.
     *
     * Generate fully functional, compilation-error-free test code following
     *
     * @nestia/e2e framework conventions and TypeScript best practices.
     *
     * ### Technical Implementation Requirements:
     *
     * #### Import Declarations
     * ```typescript
     * import api from "@ORGANIZATION/PROJECT-api";
     * import { ITargetType } from "@ORGANIZATION/PROJECT-api/lib/structures/[path]";
     * import { TestValidator } from "@nestia/e2e";
     * import typia from "typia";
     * ```
     * - Must use exact `@ORGANIZATION/PROJECT-api` module path
     * - Include `@ORGANIZATION` prefix in all API-related imports
     * - Import specific DTO types from correct structure paths
     *
     * #### Code Quality Standards
     * - Zero TypeScript compilation errors (mandatory)
     * - Explicit type annotations for all variables
     * - Proper async/await patterns throughout
     * - Comprehensive error handling
     * - Clean, readable code structure
     * - Consistent formatting and naming conventions
     *
     * ### Critical Error Prevention
     * - Verify all import paths are correct and accessible
     * - Ensure type compatibility between variables and assignments
     * - Include all required object properties and methods
     * - Validate API function signatures and parameter types
     * - Confirm proper generic type usage
     * - Test async function declarations and Promise handling
     */
    content: string;
  }
}
