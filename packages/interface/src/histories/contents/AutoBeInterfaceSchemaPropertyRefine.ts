import { AutoBeInterfaceSchemaPropertyCreate } from "./AutoBeInterfaceSchemaPropertyCreate";
import { AutoBeInterfaceSchemaPropertyDepict } from "./AutoBeInterfaceSchemaPropertyDepict";
import { AutoBeInterfaceSchemaPropertyErase } from "./AutoBeInterfaceSchemaPropertyErase";
import { AutoBeInterfaceSchemaPropertyUpdate } from "./AutoBeInterfaceSchemaPropertyUpdate";

/**
 * Property-level enrichment: depict | create | update | erase.
 *
 * Every DTO property must be handled. DB properties go here or in `excludes`.
 *
 * @author Samchon
 */
export type AutoBeInterfaceSchemaPropertyRefine =
  | AutoBeInterfaceSchemaPropertyDepict
  | AutoBeInterfaceSchemaPropertyCreate
  | AutoBeInterfaceSchemaPropertyUpdate
  | AutoBeInterfaceSchemaPropertyErase;
