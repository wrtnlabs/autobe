import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";
import { SnakePattern } from "../../typings/SnakePattern";
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
   * A detailed natural language description of how this API endpoint should be
   * tested. This should include both successful and failure scenarios, business
   * rule validations, edge cases, and any sequence of steps necessary to
   * perform the test. A subsequent agent will use this draft to generate
   * multiple concrete test cases.
   */
  draft: string;

  /**
   * Name of the function being tested.
   *
   * The identifier of the API function that this test case targets, used for
   * organizing and tracking test results.
   *
   * NOTE: This uses the same special naming convention as provider functions:
   * HTTP method + path segments joined by double underscores. Path parameters
   * are prefixed with $.
   *
   * This does NOT follow camelCase convention due to its special format:
   *
   * - HTTP method in lowercase
   * - Double underscores (__) as segment separator
   * - Path segments separated by single underscores (_)
   * - Path parameters prefixed with dollar sign ($)
   *
   * Pattern: method__segment1_segment2_$param Example: "get__users_$userId",
   * "post__orders", "delete__items_$itemId"
   */
  functionName: string & SnakePattern;

  /**
   * Functions that must be called before running the main test.
   *
   * Dependencies required to set up test data, authenticate users, create
   * resources, or establish other conditions needed for the test to execute
   * successfully.
   */
  dependencies: AutoBeTestScenarioDependency[];
}
