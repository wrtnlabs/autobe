/**
 * Remove an existing property from a DTO schema.
 *
 * Use when a property should not exist in the schema. Common cases include:
 *
 * - **Phantom fields**: Properties that don't exist in the database schema
 * - **Security violations**: Sensitive fields exposed in response DTOs (e.g.,
 *   password hash, internal flags)
 * - **Actor identity in requests**: Fields like `customer_id` or `seller_id`
 *   that should come from JWT token, not request body
 * - **System-managed fields**: Auto-generated fields (e.g., `id`, `created_at`)
 *   incorrectly included in Create DTOs
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaPropertyErase {
  /** Discriminator for property revision type. */
  type: "erase";

  /**
   * Reason for removing this property.
   *
   * Explain why this property should not exist in the schema. Be specific about
   * the violation type (phantom, security, system-managed, etc.).
   */
  reason: string;

  /** Property key to remove. */
  key: string;
}
