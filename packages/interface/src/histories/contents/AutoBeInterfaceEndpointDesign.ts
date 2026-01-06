import { AutoBeOpenApi } from "../../openapi";

/**
 * Endpoint design with description and specification.
 *
 * Represents a single endpoint generated during the write phase, pairing the
 * endpoint definition (path + method) with a description of its purpose.
 *
 * This type formalizes the legacy
 * `IAutoBeInterfaceEndpointWriteApplication.IContent` structure for reuse
 * across the codebase. The description provides business context that helps:
 *
 * - Review agents validate that the endpoint fulfills actual requirements
 * - Operation generation create appropriate request/response schemas
 * - Schema design infer correct data structures
 *
 * @author Michael
 * @author Samchon
 */
export interface AutoBeInterfaceEndpointDesign {
  /**
   * Description of what this endpoint does.
   *
   * Functional description of the endpoint's purpose and business context.
   * Should explain the use case and requirements this endpoint fulfills, not
   * just repeat the path/method.
   */
  description: string;

  /** The endpoint definition containing path and HTTP method. */
  endpoint: AutoBeOpenApi.IEndpoint;
}
