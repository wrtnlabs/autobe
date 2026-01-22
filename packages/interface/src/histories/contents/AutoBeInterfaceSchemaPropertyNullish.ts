/**
 * Change the nullability or required status of a property.
 *
 * **IMPORTANT: Only use for DB nullable → DTO non-null violations!**
 *
 * This revision type is specifically for fixing dangerous cases where:
 *
 * - Database field is nullable (can return NULL)
 * - But DTO property doesn't allow null (will cause runtime errors)
 *
 * **DO NOT use for the reverse case (DB non-null → DTO nullable)!** That
 * direction is intentionally allowed for:
 *
 * - Fields with @default values
 * - Server-generated fields
 * - Optional fields in Create/Update DTOs
 *
 * Changes the wrapper (oneOf with null) and required array. Optionally updates
 * the property's description to document the nullability.
 */
export interface AutoBeInterfaceSchemaPropertyNullish {
  type: "nullish";

  /**
   * Reason for changing nullability (should explain DB nullable → DTO non-null
   * issue).
   */
  reason: string;

  /** Property key to modify. */
  key: string;

  /**
   * Whether property should accept null values.
   *
   * Set to `true` when DB field is nullable - wraps with `oneOf: [schema, {
   * type: "null" }]`.
   *
   * **Note**: Only set to `false` for removing unnecessary null wrappers, NOT
   * for making DB nullable fields non-null in DTO (that's forbidden).
   */
  nullable: boolean;

  /**
   * Whether property should be in `required` array.
   *
   * - Read DTOs: Usually `true` (all fields present in response)
   * - Create DTOs: `true` only for non-nullable, non-@default fields
   * - Update DTOs: Always `false` (partial update)
   */
  required: boolean;

  /**
   * Optional: Updated description for the property.
   *
   * When changing nullability, you may want to update the description to
   * document the nullable behavior. If provided, replaces the existing
   * description. If not provided, the existing description is preserved.
   *
   * Example descriptions for nullable fields:
   *
   * - "User's bio. Can be null if not provided."
   * - "Expiration timestamp. Null means no expiration."
   * - "Optional discount rate. Null if no discount applies."
   */
  description: string | null;
}
