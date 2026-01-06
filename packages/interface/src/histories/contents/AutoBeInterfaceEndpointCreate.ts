import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";

/**
 * Request to create a new endpoint.
 *
 * Use this when you identify a missing endpoint that should exist based on
 * requirements analysis. Common scenarios:
 *
 * - A required operation was accidentally omitted from initial generation
 * - A use case requires an endpoint that wasn't initially identified
 * - Review reveals gaps in API coverage for specific requirements
 *
 * @author Michael
 * @author Samchon
 */
export interface AutoBeInterfaceEndpointCreate {
  /** Type discriminator indicating this is a create operation. */
  type: "create";

  /**
   * Reason for creating this endpoint.
   *
   * Explain which requirement this endpoint fulfills and why it was missing
   * from the initial generation.
   */
  reason: string;

  /** The new endpoint to add. */
  endpoint: AutoBeOpenApi.IEndpoint;

  /**
   * Description of what this endpoint does.
   *
   * Functional description of the endpoint's purpose and business context.
   */
  description: string;
}
