/**
 * Keep an existing property without modification.
 *
 * Use when a property is already correct. Explicit acknowledgment that
 * the property was reviewed and verified.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaPropertyKeep {
  /** Property key to keep. */
  key: string;

  /**
   * Database schema property this maps to, or `null` for computed properties.
   */
  databaseSchemaProperty: string | null;

  /**
   * Evidence and reasoning for keeping unchanged.
   *
   * Describe what you verified that confirms correctness.
   */
  reason: string;

  /** Discriminator for property revision type. */
  type: "keep";
}
