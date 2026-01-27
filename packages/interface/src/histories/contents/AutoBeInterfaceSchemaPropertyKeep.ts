/**
 * Keep an existing property without modification.
 *
 * Use when a property is already correct and needs no changes. This revision
 * type serves as an explicit acknowledgment that the property was reviewed.
 *
 * **Why this exists**: The review process requires every property in the schema
 * to be explicitly addressed. Using `keep` prevents accidental omissions and
 * ensures the reviewer has consciously verified the property is correct.
 *
 * A property should be kept when:
 *
 * - Type, format, and constraints match the database schema
 * - Nullability aligns with database field nullability
 * - Required status is appropriate for the DTO variant (Read/Create/Update)
 * - Description and specification are accurate and complete
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaPropertyKeep {
  /** Discriminator for property revision type. */
  type: "keep";

  /**
   * Reason for keeping this property unchanged.
   *
   * Briefly explain why the property is correct as-is. This confirms the
   * property was actually reviewed, not just skipped.
   */
  reason: string;

  /** Property key to keep. */
  key: string;
}
