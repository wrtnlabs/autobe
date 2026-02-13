/**
 * Exclude a database property from the DTO.
 *
 * Use when a database property should NOT appear in this DTO:
 *
 * - DTO purpose mismatch: `id`, `created_at` excluded from Create DTO
 * - Summary DTO: only essential display fields included
 * - Immutability: `id`, `created_at` excluded from Update DTO
 * - Security: `password`, `salt`, `refresh_token` excluded from Read DTO
 * - Aggregation relations: use computed counts instead of nested arrays
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaPropertyExclude {
  /** Database property name (column or relation) to exclude from this DTO. */
  databaseSchemaProperty: string;

  /** Explanation of why this database property is excluded. */
  reason: string;
}
