/**
 * Revision command to change the nullability or required status of a property.
 *
 * This revision type represents an atomic "change optionality" operation that
 * modifies how a property handles null values and whether it appears in the
 * `required` array. The existing property schema definition is preserved;
 * only the nullability wrapper and required status are changed.
 *
 * ## Critical Concept: Nullable vs Required
 *
 * These are distinct concepts that behave differently for Read vs Request DTOs:
 *
 * - **Nullable**: Whether the property value can be `null`
 *   - Schema representation: `oneOf: [{ type: "..." }, { type: "null" }]`
 * - **Required**: Whether the property key must be present in JSON
 *   - Schema representation: Presence in `required` array
 *
 * ## When This Revision is Used
 *
 * ### Read DTO Nullable Mismatch
 * Database field is nullable (`String?`) but DTO uses simple type:
 *
 * ```prisma
 * model Session {
 *   expired_at DateTime?  // NULLABLE
 * }
 * ```
 *
 * ❌ Wrong: `"expiredAt": { "type": "string", "format": "date-time" }`
 * ✅ Correct: `"expiredAt": { "oneOf": [{ "type": "string", "format": "date-time" }, { "type": "null" }] }`
 *
 * **For Read DTOs**: ALL fields must be in `required` array (including nullable).
 * Nullable fields use `oneOf` with null type.
 *
 * ### Request DTO Required Mismatch
 * Nullable or @default field incorrectly in `required` array:
 *
 * ```prisma
 * model User {
 *   bio  String?            // Nullable → NOT required in ICreate
 *   role String @default()  // Has default → NOT required in ICreate
 * }
 * ```
 *
 * **For Create DTOs**: Only non-nullable, non-@default fields are required.
 * **For Update DTOs**: `required` array is ALWAYS empty (all fields optional).
 *
 * ### Nullable Field Not in Required (Read DTO Fix)
 * Read DTO has nullable field correctly using `oneOf`, but missing from required:
 *
 * ```typescript
 * // Read DTOs: ALL fields present, use null for empty values
 * required: ["id", "email", "bio"]  // bio IS required, but value may be null
 * ```
 *
 * ## Rules by DTO Type
 *
 * | DTO Type | Nullable Fields | Required Array |
 * |----------|-----------------|----------------|
 * | Read (IEntity, ISummary) | Use `oneOf` with null | ALL fields |
 * | Create (ICreate) | Simple types | Non-nullable, non-@default |
 * | Update (IUpdate) | Simple types | Empty `[]` |
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaPropertyNullish {
  /**
   * Discriminator identifying this as a nullability change command.
   */
  type: "nullish";

  /**
   * Human-readable explanation of why nullability is being changed.
   *
   * Should describe the database or DTO variant rule that requires adjustment.
   * Examples:
   * - "Database field 'bio' is nullable (String?) but schema lacks oneOf null"
   * - "Request DTO: 'role' has @default, should not be required"
   * - "Update DTO: 'email' must be optional (all Update fields are optional)"
   */
  reason: string;

  /**
   * Property key (name) whose nullability is being modified.
   */
  key: string;

  /**
   * Whether the property should accept null values.
   *
   * - `true`: Property schema should use `oneOf: [originalType, { type: "null" }]`
   * - `false`: Property schema should use simple type definition
   *
   * For Read DTOs, this should match database nullable status.
   * For Request DTOs, this is typically `false` (missing = not provided).
   */
  nullable: boolean;

  /**
   * Whether the property should be in the `required` array.
   *
   * - `true`: Add to required array (field must be present)
   * - `false`: Remove from required array (field is optional)
   *
   * For Read DTOs: All fields (including nullable) should be `true`.
   * For Create DTOs: Only non-nullable, non-@default fields are `true`.
   * For Update DTOs: Always `false` (all fields optional).
   */
  required: boolean;
}
