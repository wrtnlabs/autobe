import { AutoBeTestFunctionBase } from "./AutoBeTestFunctionBase";
import { AutoBeTestScenario } from "./AutoBeTestScenario";

/**
 * E2E test scenario function with domain classification.
 *
 * @author Michael
 */
export interface AutoBeTestOperationFunction extends AutoBeTestFunctionBase<"operation"> {
  /**
   * Test scenario metadata (target endpoints, expected behavior,
   * prerequisites).
   */
  scenario: Omit<AutoBeTestScenario, "functionName">;

  /** Business domain for test organization (e.g., "user", "order", "payment"). */
  domain: string;
}
