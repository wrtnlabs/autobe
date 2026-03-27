import { AutoBeInterfaceSchemaPropertyCreate } from "./AutoBeInterfaceSchemaPropertyCreate";
import { AutoBeInterfaceSchemaPropertyDepict } from "./AutoBeInterfaceSchemaPropertyDepict";
import { AutoBeInterfaceSchemaPropertyErase } from "./AutoBeInterfaceSchemaPropertyErase";
import { AutoBeInterfaceSchemaPropertyKeep } from "./AutoBeInterfaceSchemaPropertyKeep";
import { AutoBeInterfaceSchemaPropertyNullish } from "./AutoBeInterfaceSchemaPropertyNullish";
import { AutoBeInterfaceSchemaPropertyUpdate } from "./AutoBeInterfaceSchemaPropertyUpdate";

/**
 * Property-level revision: keep | depict | create | update | erase | nullish.
 *
 * Every DTO property must be handled. DB properties go here or in `excludes`.
 *
 * @author Samchon
 */
export type AutoBeInterfaceSchemaPropertyRevise =
  | AutoBeInterfaceSchemaPropertyCreate
  | AutoBeInterfaceSchemaPropertyErase
  | AutoBeInterfaceSchemaPropertyNullish
  | AutoBeInterfaceSchemaPropertyDepict
  | AutoBeInterfaceSchemaPropertyUpdate
  | AutoBeInterfaceSchemaPropertyKeep;
