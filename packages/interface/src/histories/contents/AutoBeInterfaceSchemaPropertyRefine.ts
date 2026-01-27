import { AutoBeInterfaceSchemaPropertyCreate } from "./AutoBeInterfaceSchemaPropertyCreate";
import { AutoBeInterfaceSchemaPropertyDepict } from "./AutoBeInterfaceSchemaPropertyDepict";
import { AutoBeInterfaceSchemaPropertyErase } from "./AutoBeInterfaceSchemaPropertyErase";
import { AutoBeInterfaceSchemaPropertyUpdate } from "./AutoBeInterfaceSchemaPropertyUpdate";

/**
 * Enrich a pure JSON Schema with documentation and metadata.
 *
 * Initial JSON Schema generation produces only type structure (`type`,
 * `properties`, `$ref`, etc.) without any descriptive information. This type
 * represents the operations to add `databaseSchemaProperty`, `specification`, and
 * `description` to each property.
 *
 * - `depict`: Add documentation to existing property (most common)
 * - `create`: Add missing property with documentation
 * - `update`: Fix incorrect type and add documentation
 * - `erase`: Remove invalid property
 *
 * Unlike {@link AutoBeInterfaceSchemaPropertyRevise}, this excludes `keep` and
 * `nullish` which are for reviewing already-documented schemas.
 *
 * @author Samchon
 */
export type AutoBeInterfaceSchemaPropertyRefine =
  | AutoBeInterfaceSchemaPropertyDepict
  | AutoBeInterfaceSchemaPropertyCreate
  | AutoBeInterfaceSchemaPropertyUpdate
  | AutoBeInterfaceSchemaPropertyErase;
