import { AutoBeOpenApi } from "../../openapi";

/**
 * Request to keep an endpoint unchanged.
 *
 * Use this to explicitly approve an endpoint that is correctly designed.
 * Every endpoint in the review list MUST have a corresponding revision -
 * use `keep` for endpoints that need no changes rather than omitting them.
 *
 * This explicit approval ensures:
 *
 * - Complete review coverage (no endpoints are accidentally skipped)
 * - Documented reasoning for why the endpoint is correct
 * - Audit trail of review decisions
 *
 * @author Samchon
 */
export interface AutoBeInterfaceEndpointKeep {
  /**
   * Reason for keeping this endpoint unchanged.
   *
   * Briefly explain why this endpoint is correctly designed and needs no
   * modification. This documents the review decision.
   */
  reason: string;

  /**
   * The endpoint to keep unchanged.
   *
   * ⚠️ CRITICAL: Must be from the "Endpoints for Review" list provided above.
   * DO NOT reference endpoints that are not in the provided list. Must match
   * exactly (path + method).
   */
  endpoint: AutoBeOpenApi.IEndpoint;

  /** Type discriminator indicating this is a keep operation. */
  type: "keep";
}
