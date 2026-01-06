import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";

/**
 * Request to erase an endpoint.
 *
 * Use this when an endpoint should be removed from the generated set:
 *
 * - Duplicate functionality with another endpoint
 * - Not derived from actual requirements (hallucinated)
 * - Violates RESTful conventions or business rules
 * - Security concern (exposes sensitive data inappropriately)
 * - Over-engineering (unnecessary granularity)
 *
 * @author Michael
 * @author Samchon
 */
export interface AutoBeInterfaceEndpointErase {
  /** Type discriminator indicating this is an erase operation. */
  type: "erase";

  /**
   * Reason for deletion.
   *
   * Explain why this endpoint should be removed and what issue it causes.
   */
  reason: string;

  /**
   * The endpoint to remove.
   *
   * ⚠️ CRITICAL: Must be from the "Endpoints for Review" list provided above.
   * DO NOT reference endpoints that are not in the provided list. Must match
   * exactly (path + method).
   */
  endpoint: AutoBeOpenApi.IEndpoint;
}
