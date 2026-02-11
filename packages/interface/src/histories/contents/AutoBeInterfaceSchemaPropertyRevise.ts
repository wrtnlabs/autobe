import { AutoBeInterfaceSchemaPropertyCreate } from "./AutoBeInterfaceSchemaPropertyCreate";
import { AutoBeInterfaceSchemaPropertyDepict } from "./AutoBeInterfaceSchemaPropertyDepict";
import { AutoBeInterfaceSchemaPropertyErase } from "./AutoBeInterfaceSchemaPropertyErase";
import { AutoBeInterfaceSchemaPropertyExclude } from "./AutoBeInterfaceSchemaPropertyExclude";
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
 * **Every property must be explicitly handled** - both DTO properties and
 * database properties. This ensures complete coverage with no accidental
 * omissions that could cause runtime errors during API implementation.
 *
 * Operations for DTO properties:
 * - `depict`: Update documentation/metadata only (no type change)
 * - `create`: Add new property that should exist
 * - `update`: Replace property schema (optionally rename via `newKey`)
 * - `erase`: Remove invalid/phantom property from DTO
 * - `keep`: Explicit acknowledgment that property is correct as-is
 * - `nullish`: Change only nullable/required status
 *
 * Operation for database properties not mapped to DTO:
 * - `exclude`: Explicitly exclude a database property from DTO (with reason)
 *
 * @author Samchon
 */
export type AutoBeInterfaceSchemaPropertyRevise =
  | AutoBeInterfaceSchemaPropertyCreate
  | AutoBeInterfaceSchemaPropertyErase
  | AutoBeInterfaceSchemaPropertyNullish
  | AutoBeInterfaceSchemaPropertyDepict
  | AutoBeInterfaceSchemaPropertyUpdate
  | AutoBeInterfaceSchemaPropertyKeep
  | AutoBeInterfaceSchemaPropertyExclude;
