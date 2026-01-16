/**
 * Change the nullability or required status of a property.
 *
 * Use when the property exists but has wrong nullable/required settings.
 * Preserves the existing schema; only changes the wrapper and required array.
 */
export interface AutoBeInterfaceSchemaPropertyNullish {
  type: "nullish";

  /** Reason for changing nullability. */
  reason: string;

  /** Property key to modify. */
  key: string;

  /**
   * Whether property should accept null values.
   *
   * `true` wraps schema with `oneOf: [schema, { type: "null" }]`.
   */
  nullable: boolean;

  /** Whether property should be in `required` array. */
  required: boolean;
}
