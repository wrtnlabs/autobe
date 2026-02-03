import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";
import { AutoBeInterfaceEndpointDesign } from "./AutoBeInterfaceEndpointDesign";

/**
 * Request to update an existing endpoint.
 *
 * Use this when an endpoint has issues that need correction:
 *
 * - Path naming inconsistency (e.g., `/userProfile` vs `/users/{userId}/profile`)
 * - Incorrect HTTP method (e.g., GET for mutation operations)
 * - Path structure needs adjustment (e.g., hierarchical nesting)
 * - Parameter naming issues (e.g., `{id}` → `{userId}`)
 * - Singular/plural normalization (e.g., `/user` → `/users`)
 *
 * @author Michael
 * @author Samchon
 */
export interface AutoBeInterfaceEndpointUpdate {
  /**
   * Reason for this update.
   *
   * Explain what issue this fixes and why the new definition is better.
   */
  reason: string;

  /**
   * The original endpoint to modify.
   *
   * ⚠️ CRITICAL: Must be from the "Endpoints for Review" list provided above.
   * DO NOT reference endpoints that are not in the provided list. Must match
   * exactly (path + method).
   */
  endpoint: AutoBeOpenApi.IEndpoint;

  /** Type discriminator indicating this is an update operation. */
  type: "update";

  /**
   * The updated endpoint definition.
   *
   * Contains the corrected path and/or method.
   */
  newDesign: AutoBeInterfaceEndpointDesign;
}
