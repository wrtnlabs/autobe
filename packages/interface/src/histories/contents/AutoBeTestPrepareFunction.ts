import { AutoBeTestFunctionBase } from "./AutoBeTestFunctionBase";

/**
 * Interface defining prepare functions used in test code.
 *
 * Defines functions that generate test data objects for E2E test scenarios.
 * These functions create mock data instances that comply with the DTO schemas
 * required by API endpoints. This interface is used by AutoBE to represent the
 * structure and content of prepare functions when generating test code.
 *
 * @author Michael
 */
export interface AutoBeTestPrepareFunction
  extends AutoBeTestFunctionBase<"prepare"> {
  /**
   * DTO (Data Transfer Object) type name that this prepare function generates.
   *
   * Specifies the TypeScript type name of the object that this prepare function
   * returns. This type corresponds to the request body schema defined in the
   * OpenAPI specification for the associated endpoint.
   *
   * Example: "ICreateArticleDto", "IUpdateUserDto", "IOrderRequestDto"
   */
  typeName: string;
}
