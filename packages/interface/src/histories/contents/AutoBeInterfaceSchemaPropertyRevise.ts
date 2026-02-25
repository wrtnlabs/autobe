import { AutoBeInterfaceSchemaPropertyCreate } from "./AutoBeInterfaceSchemaPropertyCreate";
import { AutoBeInterfaceSchemaPropertyDepict } from "./AutoBeInterfaceSchemaPropertyDepict";
import { AutoBeInterfaceSchemaPropertyErase } from "./AutoBeInterfaceSchemaPropertyErase";
import { AutoBeInterfaceSchemaPropertyKeep } from "./AutoBeInterfaceSchemaPropertyKeep";
import { AutoBeInterfaceSchemaPropertyNullish } from "./AutoBeInterfaceSchemaPropertyNullish";
import { AutoBeInterfaceSchemaPropertyUpdate } from "./AutoBeInterfaceSchemaPropertyUpdate";

/**
 * Atomic property-level revision for DTO schema review.
 *
 * Used during schema review phase to validate and correct already-documented
 * DTO schemas. Each review agent (content, phantom, security, relation) uses
 * these operations to propose changes within their authority.
 *
 * **Every DTO property must be explicitly handled.** Database properties that
 * are intentionally not included in the DTO are declared separately via
 * {@link AutoBeInterfaceSchemaPropertyExclude} in the `excludes` array.
 *
 * Available operations:
 *
 * - `depict`: Update documentation/metadata only (no type change)
 * - `create`: Add new property that should exist
 * - `update`: Replace property schema (optionally rename via `newKey`)
 * - `erase`: Remove invalid/phantom property from DTO
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
