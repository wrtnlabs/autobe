import { AutoBeOpenApi } from "../../openapi";

export interface AutoBeInterfacePrerequisite {
  /**
   * The API endpoint being analyzed.
   *
   * Identifies the specific operation (method + path) that needs prerequisites.
   */
  endpoint: AutoBeOpenApi.IEndpoint;

  /**
   * Required prerequisite operations.
   *
   * List of API operations that must be successfully executed before this
   * operation can be performed. Based on resource creation dependencies and
   * existence validations from the analysis.
   */
  prerequisites: AutoBeOpenApi.IPrerequisite[];
}
