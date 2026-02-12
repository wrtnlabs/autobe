/**
 * Change the nullability or required status of a property.
 *
 * Use for DB nullable to DTO non-null violations. Do not use for the reverse
 * (DB non-null to DTO nullable is intentionally allowed).
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaPropertyNullish {
  /** Property key to modify. */
  key: string;

  /** Database schema property this maps to, or `null` for computed properties. */
  databaseSchemaProperty: string | null;

  /**
   * Evidence and reasoning for nullability change.
   *
   * Describe the DB nullable vs DTO non-null mismatch.
   */
  reason: string;

  /** Discriminator for property revision type. */
  type: "nullish";

  /** Whether property should accept null values. */
  nullable: boolean;

  /** Whether property should be in `required` array. */
  required: boolean;

  /** Updated specification, or `null` to preserve existing. */
  specification: string | null;

  /** Updated description, or `null` to preserve existing. */
  description: string | null;
}
