import { AutoBeInterfaceSchemaPropertyCreate } from "./AutoBeInterfaceSchemaPropertyCreate";
import { AutoBeInterfaceSchemaPropertyDepict } from "./AutoBeInterfaceSchemaPropertyDepict";
import { AutoBeInterfaceSchemaPropertyErase } from "./AutoBeInterfaceSchemaPropertyErase";
import { AutoBeInterfaceSchemaPropertyKeep } from "./AutoBeInterfaceSchemaPropertyKeep";
import { AutoBeInterfaceSchemaPropertyNullish } from "./AutoBeInterfaceSchemaPropertyNullish";
import { AutoBeInterfaceSchemaPropertyUpdate } from "./AutoBeInterfaceSchemaPropertyUpdate";

/**
 * Atomic property-level revision for DTO schema.
 *
 * - `depict`: Update documentation/metadata only (no type change)
 * - `create`: Add new property
 * - `update`: Replace property schema (optionally rename via `newKey`)
 * - `erase`: Remove property
 * - `keep`: Explicit acknowledgment that property is correct as-is
 * - `nullish`: Change only nullable/required status
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
