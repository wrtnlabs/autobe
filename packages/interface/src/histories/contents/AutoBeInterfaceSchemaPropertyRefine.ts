import { AutoBeInterfaceSchemaPropertyCreate } from "./AutoBeInterfaceSchemaPropertyCreate";
import { AutoBeInterfaceSchemaPropertyDepict } from "./AutoBeInterfaceSchemaPropertyDepict";
import { AutoBeInterfaceSchemaPropertyErase } from "./AutoBeInterfaceSchemaPropertyErase";
import { AutoBeInterfaceSchemaPropertyExclude } from "./AutoBeInterfaceSchemaPropertyExclude";
import { AutoBeInterfaceSchemaPropertyUpdate } from "./AutoBeInterfaceSchemaPropertyUpdate";

/**
 * Enrich a pure JSON Schema with documentation and database mapping.
 *
 * Initial JSON Schema generation produces only type structure (`type`,
 * `properties`, `$ref`, etc.) without any descriptive information. This type
 * represents the operations to add `databaseSchemaProperty`, `specification`,
 * and `description` to each property.
 *
 * **Every property must be explicitly handled** - both DTO properties and
 * database properties. This ensures complete coverage with no accidental
 * omissions that could cause runtime errors during API implementation.
 *
 * Operations for DTO properties:
 *
 * - `depict`: Add documentation to existing property (no type change)
 * - `create`: Add missing property with full documentation
 * - `update`: Fix incorrect type and add documentation
 * - `erase`: Remove invalid/phantom property from DTO
 *
 * Operation for database properties not mapped to DTO:
 *
 * - `exclude`: Explicitly exclude a database property from DTO (with reason)
 *
 * @author Samchon
 */
export type AutoBeInterfaceSchemaPropertyRefine =
  | AutoBeInterfaceSchemaPropertyDepict
  | AutoBeInterfaceSchemaPropertyCreate
  | AutoBeInterfaceSchemaPropertyUpdate
  | AutoBeInterfaceSchemaPropertyErase
  | AutoBeInterfaceSchemaPropertyExclude;
