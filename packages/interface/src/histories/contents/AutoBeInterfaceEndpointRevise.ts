import { AutoBeInterfaceEndpointCreate } from "./AutoBeInterfaceEndpointCreate";
import { AutoBeInterfaceEndpointErase } from "./AutoBeInterfaceEndpointErase";
import { AutoBeInterfaceEndpointUpdate } from "./AutoBeInterfaceEndpointUpdate";

/**
 * Endpoint revision operation type.
 *
 * Discriminated union representing all possible endpoint modifications during
 * the review phase. Review agents examine generated endpoints and return an
 * array of these operations to correct issues:
 *
 * - **Create**: Add missing endpoints that fulfill requirements
 * - **Update**: Fix incorrectly structured endpoints (path/method corrections)
 * - **Erase**: Remove invalid or duplicate endpoints
 *
 * @author Michael
 * @author Samchon
 */
export type AutoBeInterfaceEndpointRevise =
  | AutoBeInterfaceEndpointCreate
  | AutoBeInterfaceEndpointUpdate
  | AutoBeInterfaceEndpointErase;
