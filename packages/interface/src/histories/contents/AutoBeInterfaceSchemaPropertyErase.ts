/**
 * Remove an existing property from a DTO schema.
 *
 * Use for phantom fields, security violations, or system-managed fields.
 */
export interface AutoBeInterfaceSchemaPropertyErase {
  type: "erase";

  /** Reason for removing this property. */
  reason: string;

  /** Property key to remove. */
  key: string;
}
