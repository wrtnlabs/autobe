import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";
import { AutoBeTestScenarioDependency } from "./AutoBeTestScenarioDependency";

export interface AutoBeTestScenario {
  /**
   * The API endpoint being tested.
   *
   * Contains the complete endpoint specification including URL, method,
   * parameters, and expected responses that will be validated by this test
   * scenario.
   */
  endpoint: AutoBeOpenApi.IEndpoint;

  /**
   * A detailed natural language description of how this API endpoint should
   * be tested. This should include both successful and failure scenarios,
   * business rule validations, edge cases, and any sequence of steps
   * necessary to perform the test. A subsequent agent will use this draft to
   * generate multiple concrete test cases.
   */
  draft: string;

  /**
   * Name of the function being tested.
   *
   * The identifier of the API function that this test case targets, used for
   * organizing and tracking test results.
   */
  functionName: string;

  /**
   * Functions that must be called before running the main test.
   *
   * Dependencies required to set up test data, authenticate users, create
   * resources, or establish other conditions needed for the test to execute
   * successfully.
   */
  dependencies: AutoBeTestScenarioDependency[];
}
