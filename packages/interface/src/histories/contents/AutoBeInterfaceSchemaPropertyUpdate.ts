import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";

/**
 * Revision command to replace an existing property's schema definition.
 *
 * This revision type represents an atomic "replace property schema" operation
 * that completely substitutes the existing property definition with a new one.
 * Use this when the property exists but has incorrect type, format, or structure.
 *
 * ## When This Revision is Used
 *
 * ### Type Correction
 * Property type doesn't match database-to-OpenAPI mapping:
 *
 * | Database Type | OpenAPI Type | Format |
 * |---------------|--------------|--------|
 * | Int | integer | - |
 * | BigInt | string | - |
 * | Float | number | - |
 * | Decimal | number | - |
 * | DateTime | string | date-time |
 * | Boolean | boolean | - |
 *
 * ```typescript
 * // Database: price Decimal
 * // ❌ Wrong: { "type": "string" }
 * // ✅ Correct: { "type": "number" }
 * ```
 *
 * ### Format Addition
 * Missing required format specifier for typed strings:
 *
 * ```typescript
 * // Database: createdAt DateTime
 * // ❌ Wrong: { "type": "string" }
 * // ✅ Correct: { "type": "string", "format": "date-time" }
 * ```
 *
 * ### Enum Definition Correction
 * Enum values don't match database enum definition:
 *
 * ```prisma
 * enum OrderStatus {
 *   PENDING
 *   CONFIRMED
 *   SHIPPED
 *   DELIVERED
 *   CANCELLED  // Missing in generated schema
 * }
 * ```
 *
 * ### Relation Reference Correction
 * Foreign key reference points to wrong type:
 *
 * ```typescript
 * // Full entity context needs IUser, not IUser.ISummary
 * // ❌ Wrong: { "$ref": "#/components/schemas/IUser.ISummary" }
 * // ✅ Correct: { "$ref": "#/components/schemas/IUser" }
 * ```
 *
 * ## Difference from Nullish Revision
 *
 * - **nullish**: Only changes `oneOf` wrapper and `required` status
 * - **update**: Completely replaces the property schema definition
 *
 * Use `update` when the fundamental type/structure is wrong.
 * Use `nullish` when only optionality settings need adjustment.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaPropertyUpdate {
  /**
   * Discriminator identifying this as a property schema replacement command.
   */
  type: "update";

  /**
   * Human-readable explanation of why this property's schema is being replaced.
   *
   * Should describe the type mismatch or structural issue being corrected.
   * Examples:
   * - "Type mismatch: 'price' is Decimal in database, should be number not string"
   * - "Missing format: 'createdAt' is DateTime, needs format 'date-time'"
   * - "Enum values: 'status' missing value 'CANCELLED' from database enum"
   * - "Relation: 'author' should reference IUser not IUser.ISummary"
   */
  reason: string;

  /**
   * Property key (name) whose schema definition is being replaced.
   */
  key: string;

  /**
   * New complete JSON schema definition for the property.
   *
   * This schema will completely replace the existing definition at
   * `schema.properties[key] = schema`. Should include proper type,
   * format, description, and any other required metadata.
   */
  schema: AutoBeOpenApi.IJsonSchemaDescriptive;

  /**
   * Whether the property should be in the `required` array after update.
   *
   * - `true`: Ensure property is in required array
   * - `false`: Ensure property is not in required array
   *
   * This may change from the original if the type change affects optionality.
   */
  required: boolean;
}
