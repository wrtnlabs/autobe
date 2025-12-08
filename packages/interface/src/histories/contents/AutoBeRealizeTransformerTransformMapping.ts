/**
 * Single DTO property transformation mapping for the transform() function.
 *
 * Documents how to transform Prisma payload data into each specific DTO
 * property in the transform() function. This structured approach ensures
 * complete DTO coverage by requiring explicit documentation for EVERY property
 * - including those requiring special transformations or computed from multiple
 * Prisma fields.
 *
 * **Purpose**:
 *
 * - Prevents property omissions through systematic coverage verification
 * - Forces explicit decision-making for each DTO property transformation
 * - Enables validation before code generation (Write) or correction (Correct)
 * - Creates clear documentation of transformation logic
 *
 * **Usage Contexts**:
 *
 * - **Write Phase**: Plan how to transform each Prisma field → DTO property in
 *   transform()
 * - **Correct Phase**: Document current state and correction plan for each
 *   property in transform()
 *
 * The validator cross-checks mappings against the DTO type definition to ensure
 * nothing is overlooked, rejecting incomplete mappings.
 *
 * **Critical Principle**:
 *
 * This mapping is ONLY for the transform() function - it documents how to build
 * the DTO return object. The corresponding select() function requirements are
 * documented separately in AutoBeRealizeTransformerSelectMapping.
 *
 * @author Samchon
 */
export interface AutoBeRealizeTransformerTransformMapping {
  /**
   * Exact DTO property name from the DTO type definition.
   *
   * MUST match the DTO interface exactly (case-sensitive). Examples:
   *
   * - Scalar properties: "id", "email", "createdAt"
   * - Computed properties: "totalPrice", "reviewCount", "isExpired"
   * - Nested objects: "customer", "article"
   * - Arrays: "tags", "comments"
   *
   * Use camelCase as DTOs follow TypeScript conventions (unlike Prisma's
   * snake_case).
   *
   * Include ALL properties from the DTO, even if they require complex
   * transformations or are computed from multiple Prisma fields.
   *
   * **Examples**:
   *
   * ```typescript
   * // Direct scalar mappings
   * { property: "id", how: "From prisma.id" }
   * { property: "email", how: "From prisma.email" }
   * { property: "createdAt", how: "From prisma.created_at.toISOString()" }
   *
   * // Type conversions
   * { property: "price", how: "From prisma.unit_price (Decimal → Number)" }
   * { property: "deletedAt", how: "From prisma.deleted_at?.toISOString() ?? null" }
   *
   * // Computed properties
   * { property: "totalPrice", how: "Compute: prisma.unit_price * prisma.quantity" }
   * { property: "reviewCount", how: "From prisma._count.reviews" }
   * { property: "isExpired", how: "Compute: prisma.expiry_date < new Date()" }
   *
   * // Nested transformations
   * { property: "customer", how: "Transform with CustomerTransformer" }
   * { property: "tags", how: "Array map with TagTransformer" }
   * ```
   */
  property: string;

  /**
   * Brief one-line explanation of how to obtain this property's value from
   * Prisma.
   *
   * Keep it concise and clear.
   *
   * **For Write Phase** (planning transformation strategy):
   *
   * - "From prisma.email"
   * - "From prisma.created_at.toISOString()"
   * - "From prisma.unit_price (Decimal → Number)"
   * - "From prisma.deleted_at?.toISOString() ?? null"
   * - "Compute: prisma.unit_price * prisma.quantity"
   * - "From prisma._count.reviews"
   * - "Compute: prisma.expiry_date < new Date()"
   * - "Transform with CustomerTransformer"
   * - "Array map with TagTransformer"
   * - "From prisma.customer.name (nested field)"
   *
   * **For Correct Phase** (documenting current state and fixes):
   *
   * - "No change needed - correct"
   * - "Already correct"
   * - "Fix: Wrong property name 'userEmail' → 'email'"
   * - "Fix: Missing property - add from prisma.total_price"
   * - "Fix: Wrong transformation - should use .toISOString()"
   * - "Fix: Should use TagTransformer instead of inline"
   * - "Fix: Missing Decimal conversion"
   * - "Fix: Fabricated property - remove it"
   *
   * Even if a property is correct, you MUST include it in the mapping and
   * explain why. This ensures complete DTO coverage.
   *
   * This is NOT code - just a simple description of the transformation
   * strategy.
   */
  how: string;
}
export namespace AutoBeRealizeTransformerTransformMapping {
  export type Metadata = Omit<AutoBeRealizeTransformerTransformMapping, "how">;
}
