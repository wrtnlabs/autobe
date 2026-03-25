import { AutoBeInterfaceEndpointCreate } from "./AutoBeInterfaceEndpointCreate";
import { AutoBeInterfaceEndpointErase } from "./AutoBeInterfaceEndpointErase";
import { AutoBeInterfaceEndpointKeep } from "./AutoBeInterfaceEndpointKeep";
import { AutoBeInterfaceEndpointUpdate } from "./AutoBeInterfaceEndpointUpdate";

/**
 * Endpoint revision: keep | create | update | erase.
 *
 * Every endpoint in the review list MUST have a revision — no omissions.
 *
 * @author Michael
 * @author Samchon
 */
export type AutoBeInterfaceEndpointRevise =
  | AutoBeInterfaceEndpointCreate
  | AutoBeInterfaceEndpointUpdate
  | AutoBeInterfaceEndpointErase
  | AutoBeInterfaceEndpointKeep;
