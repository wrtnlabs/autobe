import { AutoBeInterfaceEndpointCreate } from "./AutoBeInterfaceEndpointCreate";
import { AutoBeInterfaceEndpointErase } from "./AutoBeInterfaceEndpointErase";
import { AutoBeInterfaceEndpointKeep } from "./AutoBeInterfaceEndpointKeep";
import { AutoBeInterfaceEndpointUpdate } from "./AutoBeInterfaceEndpointUpdate";

/**
 * Endpoint revision operation type.
 *
 * Discriminated union representing all possible endpoint modifications during
 * the review phase. Review agents examine generated endpoints and must return a
 * revision for **every** endpoint in the provided list - no omissions allowed.
 *
 * ## Available Operations
 *
 * - **Keep**: Approve endpoint as-is (explicitly confirm it's correct)
 * - **Create**: Add missing endpoints that fulfill requirements
 * - **Update**: Fix incorrectly structured endpoints (path/method corrections)
 * - **Erase**: Remove invalid or duplicate endpoints
 *
 * ## Important Rules
 *
 * 1. Every endpoint in the review list MUST have a corresponding revision
 * 2. Use `keep` for endpoints that are correct - do NOT simply omit them
 * 3. The `endpoint` field in `keep`, `update`, and `erase` must exactly match an
 *    endpoint from the provided list (path + method)
 *
 * @author Michael
 * @author Samchon
 */
export type AutoBeInterfaceEndpointRevise =
  | AutoBeInterfaceEndpointCreate
  | AutoBeInterfaceEndpointUpdate
  | AutoBeInterfaceEndpointErase
  | AutoBeInterfaceEndpointKeep;
