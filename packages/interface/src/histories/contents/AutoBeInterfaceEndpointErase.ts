import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";

/**
 * Remove an invalid or duplicate endpoint.
 *
 * @author Michael
 * @author Samchon
 */
export interface AutoBeInterfaceEndpointErase {
  /** Why this endpoint should be removed. */
  reason: string;

  /**
   * Endpoint to remove. MUST match exactly (path + method) from the provided
   * review list.
   */
  endpoint: AutoBeOpenApi.IEndpoint;

  /** Type discriminator. */
  type: "erase";
}
