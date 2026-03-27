/**
 * DTO property transformation mapping for the transform() function.
 *
 * Documents how to transform Prisma payload data into each DTO property. EVERY
 * DTO property must be listed — the validator rejects incomplete mappings.
 *
 * @author Samchon
 */
export interface AutoBeRealizeTransformerTransformMapping {
  /**
   * Exact DTO property name (case-sensitive, camelCase).
   *
   * Include ALL properties: direct mappings, type conversions, computed values,
   * and nested transformations.
   *
   * **Examples**:
   *
   * ```typescript
   * // Direct scalar mappings
   * { property: "id", how: "From prisma.id" }
   * { property: "createdAt", how: "From prisma.created_at.toISOString()" }
   *
   * // Type conversions
   * { property: "price", how: "From prisma.unit_price (Decimal → Number)" }
   * { property: "deletedAt", how: "From prisma.deleted_at?.toISOString() ?? null" }
   *
   * // Computed properties
   * { property: "totalPrice", how: "Compute: prisma.unit_price * prisma.quantity" }
   * { property: "reviewCount", how: "From prisma._count.reviews" }
   *
   * // Nested transformations (reuse neighbor transformers)
   * { property: "customer", how: "Transform with CustomerTransformer" }
   * { property: "tags", how: "Array map with TagTransformer" }
   * ```
   */
  property: string;

  /**
   * Brief strategy for obtaining this property's value (NOT code).
   *
   * Write phase: "From prisma.email", "From prisma.created_at.toISOString()",
   * "From prisma.deleted_at?.toISOString() ?? null", "From prisma.unit_price
   * (Decimal → Number)", "Transform with CustomerTransformer", "Array map with
   * TagTransformer", "Compute: prisma.unit_price * prisma.quantity".
   *
   * Correct phase: "No change needed", "Fix: Missing Decimal conversion", "Fix:
   * Should use TagTransformer instead of inline".
   *
   * Even if correct, you MUST include it. This ensures complete DTO coverage.
   */
  how: string;
}
export namespace AutoBeRealizeTransformerTransformMapping {
  export type Metadata = Omit<AutoBeRealizeTransformerTransformMapping, "how">;
}
