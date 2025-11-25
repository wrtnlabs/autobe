import { AutoBeOpenApi } from "../../openapi";

/**
 * Interface defining generation functions that create resources used in test functions.
 *
 * Defines functions that generate necessary resources required by test functions
 * to execute properly. These generation functions create resources that support
 * test execution, including test data, helper functions, and other testing utilities.
 * This interface is used by AutoBE to represent the structure and content of
 * resource generation functions when generating test code.
 *
 * Generation functions are essential for providing the resources that test functions
 * need, ensuring tests have all required dependencies for proper execution.
 *
 * @author Michael
 */
export interface AutoBeTestWriteGenerationFunction {
  /**
   * Type discriminator indicating that this object is a generation function.
   * Used to distinguish types in the discriminated union pattern.
   */
  kind: "generation";

  /**
   * OpenAPI endpoint specification that this generation function corresponds
   * to.
   *
   * Used to determine which endpoint this generation function was created for.
   * The generation function creates data that matches the endpoint's request
   * body schema. For example, a generation function for POST /api/articles
   * would generate random article data matching the endpoint's input
   * requirements.
   */
  endpoint: AutoBeOpenApi.IEndpoint;

  /**
   * Actor name representing the user role context for data generation.
   *
   * Examples: "admin", "user", "guest", etc. When set, the generated data
   * respects the permissions and constraints specific to that actor. For
   * instance, an admin actor might generate data with additional privileged
   * fields that regular users cannot access.
   *
   * When null, it indicates that the generation function is actor-agnostic and
   * creates general-purpose test data not tied to any specific user role or
   * permission context.
   */
  actor: string | null;

  /**
   * Function name of the generation function.
   *
   * The TypeScript function name in snake_case format that clearly describes
   * what data is being generated. The naming convention typically follows the
   * pattern: generate_[adjective]_[entity]_[details].
   *
   * Example: "generate_random_bbs_article", "generate_valid_user_profile",
   * "generate_invalid_payment_request"
   */
  functionName: string;

  /**
   * File system path where the generation function should be located.
   *
   * Specifies the relative or absolute path for the generation function within
   * the project structure. This location typically follows test utility
   * conventions and may be organized by API endpoints, feature modules, or
   * business domains to ensure logical test suite organization and easy
   * navigation.
   *
   * Example: "test/features/common/generate/generate_random_bbs_article.ts",
   */
  location: string;

  /**
   * Complete TypeScript source code content of the resource generation function.
   *
   * Contains the full implementation of the function that generates resources
   * required by test functions. The content is structured as executable TypeScript
   * code that creates various testing resources needed during test execution.
   *
   * The content ensures that test functions have all necessary resources to
   * execute properly, maintaining consistency with the application's requirements
   * and constraints. The generation function serves as a critical resource provider
   * in the test suite, supplying test functions with everything they need for
   * proper testing.
   */
  content: string;
}
