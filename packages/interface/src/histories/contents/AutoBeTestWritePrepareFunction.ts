import { AutoBeOpenApi } from "../../openapi";

/**
 * Interface defining prepare functions used in test code.
 *
 * Defines functions that generate test data objects for E2E test scenarios.
 * These functions create mock data instances that comply with the DTO schemas
 * required by API endpoints. This interface is used by AutoBE to represent
 * the structure and content of prepare functions when generating test code.
 *
 * @author Michael
 */
export interface AutoBeTestWritePrepareFunction {
  /**
   * Type discriminator indicating that this object is a prepare function.
   * Used to distinguish types in the discriminated union pattern.
   */
  kind: "prepare";

  /**
   * OpenAPI endpoint specification that this prepare function corresponds to.
   *
   * Used to determine which endpoint this prepare function generates test data
   * for. The prepare function creates data objects that match the request body
   * schema of this endpoint.
   */
  endpoint: AutoBeOpenApi.IEndpoint;
  
  /**
   * DTO (Data Transfer Object) type name that this prepare function generates.
   *
   * Specifies the TypeScript type name of the object that this prepare function
   * returns. This type corresponds to the request body schema defined in the
   * OpenAPI specification for the associated endpoint.
   *
   * Example: "ICreateArticleDto", "IUpdateUserDto", "IOrderRequestDto"
   */
  dtoTypeName: string;

  /**
   * File system path where the prepare function should be located.
   *
   * Specifies the relative or absolute path for the prepare function within
   * the project structure. This location typically follows test conventions
   * and may be organized by feature modules or business domains to ensure
   * logical test suite organization and easy navigation.
   *
   * Example: "test/features/bbs/prepare/prepare_random_bbs_article.ts"
   */
  location: string;

  /**
   * Function name of the prepare function.
   *
   * The TypeScript function name in snake_case format that describes what
   * test data is being prepared.
   *
   * Example: "prepare_random_bbs_article", "prepare_create_user_dto",
   * "prepare_order_request"
   */
  functionName: string;

  /**
   * Complete TypeScript source code content of the prepare function.
   *
   * Contains the full implementation of the prepare function including imports,
   * helper functions, and the actual data generation logic. The content is
   * structured as executable TypeScript code that creates valid test data
   * objects for the specified DTO type.
   *
   * Each prepare function typically includes:
   *
   * - Random data generation using libraries like faker or custom generators
   * - Proper typing with the specified DTO interface
   * - Optional parameters to customize generated data
   * - Validation to ensure generated data meets schema requirements
   *
   * The content ensures that the prepare function generates realistic and
   * valid test data that can be used in E2E test scenarios, API calls, and
   * integration tests. The generated data adheres to all constraints and
   * validation rules defined in the DTO schema.
   *
   * The prepare function serves as a centralized factory for test data,
   * promoting reusability and consistency across the test suite while
   * reducing duplication and maintenance overhead.
   */
  content: string;
}
