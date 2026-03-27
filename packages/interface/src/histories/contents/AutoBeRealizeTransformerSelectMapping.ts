/**
 * Prisma field selection mapping for the select() function.
 *
 * Documents which Prisma fields/relations must be selected to enable
 * transform() to build the DTO. EVERY required field must be listed — the
 * validator rejects incomplete selections.
 *
 * @author Samchon
 */
export interface AutoBeRealizeTransformerSelectMapping {
  /**
   * Exact Prisma field or relation name from the Prisma schema.
   *
   * MUST match the Prisma schema exactly (case-sensitive, snake_case).
   *
   * **Field Types**:
   *
   * - **Scalar fields**: Database columns (id, email, created_at, unit_price)
   * - **BelongsTo relations**: FK relations (customer, article, category)
   * - **HasMany relations**: 1:N arrays (tags, comments, reviews)
   * - **Aggregations**: Prisma computed fields (_count, _sum, _avg)
   *
   * **Examples**:
   *
   * ```typescript
   * // Scalar fields
   * { member: "id", kind: "scalar", nullable: false, how: "For DTO.id" }
   * { member: "created_at", kind: "scalar", nullable: false, how: "For DTO.createdAt (needs .toISOString())" }
   * { member: "unit_price", kind: "scalar", nullable: false, how: "For DTO.price (Decimal → Number)" }
   * { member: "deleted_at", kind: "scalar", nullable: true, how: "For DTO.deletedAt (nullable DateTime)" }
   *
   * // BelongsTo relations — member is ALWAYS the Prisma relation name,
   * // which may differ from the DTO property name
   * { member: "customer", kind: "belongsTo", nullable: false, how: "For DTO.buyer (nested transformer)" }
   * { member: "user", kind: "belongsTo", nullable: true, how: "For DTO.voter (optional nested)" }
   *
   * // HasMany relations
   * { member: "tags", kind: "hasMany", nullable: null, how: "For DTO.tags (array transformer)" }
   * ```
   *
   * DO NOT use DTO property names — this is about Prisma schema members. Read
   * the Relation Mapping Table and member list to find correct names.
   */
  member: string;

  /**
   * Kind of Prisma schema member.
   *
   * - `"scalar"`: Regular column → `{ field: true }`
   * - `"belongsTo"`: FK relation → `{ relation: { select: ... } }`
   * - `"hasOne"`: 1:1 relation → nested select
   * - `"hasMany"`: 1:N relation → `{ relation: { select: ... } }`
   *
   * The kind forces explicit classification of each member BEFORE deciding
   * select syntax, preventing confusion between scalars and relations.
   */
  kind: "scalar" | "belongsTo" | "hasOne" | "hasMany";

  /**
   * Whether nullable in Prisma schema.
   *
   * - `false`: Always present — transform() can safely access
   * - `true`: May be null — transform() must handle null case
   * - `null`: Not applicable (hasMany/hasOne)
   */
  nullable: boolean | null;

  /**
   * Brief reason for selecting this field (NOT code).
   *
   * Write phase: "For DTO.id", "For DTO.createdAt (needs .toISOString())", "For
   * DTO.customer (nested transformer)".
   *
   * Correct phase: "No change needed", "Fix: Missing field — add for
   * DTO.totalPrice".
   *
   * Even if correct, you MUST include it in the mapping. This ensures complete
   * coverage and alignment with transform().
   */
  how: string;
}
export namespace AutoBeRealizeTransformerSelectMapping {
  export type Metadata = Omit<AutoBeRealizeTransformerSelectMapping, "how">;
}
