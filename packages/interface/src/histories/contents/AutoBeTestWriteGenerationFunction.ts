import { AutoBeOpenApi } from "../../openapi";
import { AutoBeTestWriteFunctionBase } from "./AutoBeTestWriteFunctionBase";

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
export interface AutoBeTestWriteGenerationFunction
  extends AutoBeTestWriteFunctionBase<"generation"> {
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
}
