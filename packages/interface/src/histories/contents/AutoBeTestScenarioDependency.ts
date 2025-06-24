import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";

/**
 * A dependency function that must be called before the main test.
 *
 * Represents a prerequisite API call needed to prepare the system state for
 * successful test execution.
 *
 * @author Kakasoo
 */
export interface AutoBeTestScenarioDependency {
  /**
   * Why this dependency is needed.
   *
   * Explains the role of this prerequisite function in setting up the
   * conditions required for the main test to succeed.
   */
  purpose: string;

  /**
   * The API endpoint for this dependency function.
   *
   * Complete specification of the prerequisite function that needs to be
   * called, including parameters and expected behavior.
   */
  endpoint: AutoBeOpenApi.IEndpoint;
}
