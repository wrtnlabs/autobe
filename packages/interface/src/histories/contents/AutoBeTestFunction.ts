import { AutoBeTestAuthorizeFunction } from "./AutoBeTestAuthorizeFunction";
import { AutoBeTestGenerateFunction } from "./AutoBeTestGenerateFunction";
import { AutoBeTestOperationFunction } from "./AutoBeTestOperationFunction";
import { AutoBeTestPrepareFunction } from "./AutoBeTestPrepareFunction";

/**
 * Discriminated union of all test function types.
 *
 * The `type` discriminator distinguishes:
 *
 * - **AutoBeTestPrepareFunction**: Test data preparation (mock DTOs)
 * - **AutoBeTestGenerateFunction**: Resource generation (test data/utilities)
 * - **AutoBeTestAuthorizeFunction**: Authentication functions (login, signup,
 *   refresh)
 * - **AutoBeTestOperationFunction**: E2E test scenario implementations
 *
 * @author Michael
 */
export type AutoBeTestFunction =
  | AutoBeTestPrepareFunction
  | AutoBeTestGenerateFunction
  | AutoBeTestAuthorizeFunction
  | AutoBeTestOperationFunction;

export namespace AutoBeTestFunction {
  /** Union of all `type` discriminator literals. */
  export type Type = AutoBeTestFunction["type"];

  /** Maps `type` discriminator values to their corresponding function types. */
  export type Mapper = {
    authorize: AutoBeTestAuthorizeFunction;
    prepare: AutoBeTestPrepareFunction;
    generate: AutoBeTestGenerateFunction;
    operation: AutoBeTestOperationFunction;
  };
}
