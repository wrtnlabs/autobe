import { AutoBeInterfaceEndpointDesign } from "./AutoBeInterfaceEndpointDesign";

/**
 * Add a missing endpoint.
 *
 * @author Michael
 * @author Samchon
 */
export interface AutoBeInterfaceEndpointCreate {
  /** Why this endpoint is needed. */
  reason: string;

  /** Type discriminator. */
  type: "create";

  /** The new endpoint to add. */
  design: AutoBeInterfaceEndpointDesign;
}
