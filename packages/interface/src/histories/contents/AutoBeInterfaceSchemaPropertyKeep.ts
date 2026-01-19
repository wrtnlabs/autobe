/**
 * Keep an existing property without modification.
 *
 * Use when a property is already correct and needs no changes.
 * This ensures every property in the object schema is explicitly addressed,
 * preventing accidental omissions during schema review.
 */
export interface AutoBeInterfaceSchemaPropertyKeep {
  type: "keep";

  /** Reason for keeping this property unchanged. */
  reason: string;

  /** Property key to keep. */
  key: string;
}
