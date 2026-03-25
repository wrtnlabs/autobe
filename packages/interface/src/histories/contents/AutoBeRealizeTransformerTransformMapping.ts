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
   * Include ALL properties: direct mappings, type conversions (Decimal →
   * Number, DateTime → ISO string), computed values, and nested
   * transformations.
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
   * Correct phase: "No change needed", "Fix: Missing Decimal conversion".
   */
  how: string;
}
export namespace AutoBeRealizeTransformerTransformMapping {
  export type Metadata = Omit<AutoBeRealizeTransformerTransformMapping, "how">;
}
