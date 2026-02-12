import { AutoBeInterfaceSchemaPropertyCreate } from "./AutoBeInterfaceSchemaPropertyCreate";
import { AutoBeInterfaceSchemaPropertyDepict } from "./AutoBeInterfaceSchemaPropertyDepict";
import { AutoBeInterfaceSchemaPropertyErase } from "./AutoBeInterfaceSchemaPropertyErase";
import { AutoBeInterfaceSchemaPropertyUpdate } from "./AutoBeInterfaceSchemaPropertyUpdate";

/**
 * Enrich a pure JSON Schema with documentation and database mapping.
 *
 * Initial JSON Schema generation produces only type structure (`type`,
 * `properties`, `$ref`, etc.) without any descriptive information. This type
 * represents the operations to add `databaseSchemaProperty`, `specification`,
 * and `description` to each property.
 *
 * **Every DTO property must be explicitly handled.** Database properties that
 * are intentionally not included in the DTO are declared separately via
 * {@link AutoBeInterfaceSchemaPropertyExclude} in the `excludes` array.
 *
 * Available operations:
 *
 * - `depict`: Add documentation to existing property (no type change)
 * - `create`: Add missing property with full documentation
 * - `update`: Fix incorrect type and add documentation
 * - `erase`: Remove invalid/phantom property from DTO
 *
 * @author Samchon
 */
export type AutoBeInterfaceSchemaPropertyRefine =
  | AutoBeInterfaceSchemaPropertyDepict
  | AutoBeInterfaceSchemaPropertyCreate
  | AutoBeInterfaceSchemaPropertyUpdate
  | AutoBeInterfaceSchemaPropertyErase;
