import { AutoBeOpenApi } from "../../openapi";

/**
 * Approve an endpoint as correctly designed.
 *
 * Every endpoint in the review list MUST have a revision — use `keep` for
 * correct ones rather than omitting them.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceEndpointKeep {
  /** Why this endpoint is correct and needs no changes. */
  reason: string;

  /**
   * Endpoint to keep. MUST match exactly (path + method) from the provided
   * review list.
   */
  endpoint: AutoBeOpenApi.IEndpoint;

  /** Type discriminator. */
  type: "keep";
}
