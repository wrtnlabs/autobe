// import { IAutoBeTypeScriptCompileResult } from "../../compiler/IAutoBeTypeScriptCompileResult";
import { AutoBeTestScenario } from "./AutoBeTestScenario";

/**
 * A generated test file with scenario metadata.
 *
 * @author Kakasoo
 */
export interface AutoBeTestFile {
  /**
   * File path for the test (e.g.,
   * "test/features/api/order/test_api_shopping_order_publish.ts").
   */
  location: string;

  /** Complete TypeScript source code of the test file. */
  content: string;

  /**
   * Test scenario metadata (target endpoints, expected behavior,
   * prerequisites).
   */
  scenario: AutoBeTestScenario;

  // /**
  //  * Compilation result of the generated test code.
  //  *
  //  * @see {@link IAutoBeTypeScriptCompileResult} for detailed result types
  //  */
  // result: IAutoBeTypeScriptCompileResult;
}
