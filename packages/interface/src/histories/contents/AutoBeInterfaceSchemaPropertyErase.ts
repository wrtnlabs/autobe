/**
 * Remove an existing property from a DTO schema.
 *
 * Use when a property should not exist: phantom fields, security violations,
 * actor identity in requests, or system-managed fields in Create DTOs.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaPropertyErase {
  /** Property key to remove. */
  key: string;

  /**
   * Database schema property this maps to, or `null` if none.
   *
   * For erase, this should typically be `null` (phantom) or identify the DB
   * property that shouldn't be exposed.
   */
  databaseSchemaProperty: string | null;

  /**
   * Evidence and reasoning for removal.
   *
   * Describe what you checked and what you found that justifies erasure.
   */
  reason: string;

  /** Discriminator for property revision type. */
  type: "erase";
}
