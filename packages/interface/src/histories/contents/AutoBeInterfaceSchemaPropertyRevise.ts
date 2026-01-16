import { AutoBeInterfaceSchemaPropertyCreate } from "./AutoBeInterfaceSchemaPropertyCreate";
import { AutoBeInterfaceSchemaPropertyErase } from "./AutoBeInterfaceSchemaPropertyErase";
import { AutoBeInterfaceSchemaPropertyNullish } from "./AutoBeInterfaceSchemaPropertyNullish";
import { AutoBeInterfaceSchemaPropertyUpdate } from "./AutoBeInterfaceSchemaPropertyUpdate";

/**
 * Discriminated union of all possible property-level revision commands.
 *
 * This type defines the complete set of atomic operations that can be performed
 * on individual properties within a DTO schema. Each revision type represents
 * a specific kind of modification with explicit justification.
 *
 * ## Union Members
 *
 * ### {@link AutoBeInterfaceSchemaPropertyCreate} (type: "create")
 * Add a new property that should exist but is missing:
 * - Missing database field mapping
 * - New relation reference
 * - Computed/aggregation field
 *
 * ### {@link AutoBeInterfaceSchemaPropertyErase} (type: "erase")
 * Remove a property that should not exist:
 * - Phantom field (not in database)
 * - Security violation (auth context in request)
 * - System-managed field in Create DTO
 *
 * ### {@link AutoBeInterfaceSchemaPropertyNullish} (type: "nullish")
 * Change only nullability and required status:
 * - Nullable mismatch with database
 * - Required array correction by DTO variant
 * - Read DTO missing oneOf null wrapper
 *
 * ### {@link AutoBeInterfaceSchemaPropertyUpdate} (type: "update")
 * Replace property schema definition entirely:
 * - Type correction (wrong OpenAPI type)
 * - Format addition (missing date-time)
 * - Enum value correction
 * - Relation reference fix
 *
 * ## Common Structure
 *
 * All revision types share these fields:
 * - `type`: Discriminator for pattern matching
 * - `reason`: Human-readable justification for the change
 * - `key`: Property name being modified
 *
 * ## Application Order
 *
 * Revisions in {@link AutoBeInterfaceSchemaPropertyEvent}.revises are applied
 * sequentially. Order matters when:
 * - Creating then updating the same property
 * - Erasing then creating a replacement
 *
 * @author Samchon
 */
export type AutoBeInterfaceSchemaPropertyRevise =
  | AutoBeInterfaceSchemaPropertyCreate
  | AutoBeInterfaceSchemaPropertyErase
  | AutoBeInterfaceSchemaPropertyNullish
  | AutoBeInterfaceSchemaPropertyUpdate;
