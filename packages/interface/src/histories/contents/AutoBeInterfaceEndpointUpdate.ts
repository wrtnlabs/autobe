import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";
import { AutoBeInterfaceEndpointDesign } from "./AutoBeInterfaceEndpointDesign";

/**
 * Fix an incorrectly structured endpoint (path/method corrections).
 *
 * @author Michael
 * @author Samchon
 */
export interface AutoBeInterfaceEndpointUpdate {
  /** Why this fix is needed. */
  reason: string;

  /**
   * Original endpoint to modify. MUST match exactly (path + method) from the
   * provided review list.
   */
  endpoint: AutoBeOpenApi.IEndpoint;

  /** Type discriminator. */
  type: "update";

  /** Corrected endpoint definition. */
  newDesign: AutoBeInterfaceEndpointDesign;
}
