/**
 * Field/relation mapping for Prisma CreateInput generation.
 *
 * Documents handling strategy for ONE Prisma schema member. EVERY field and
 * relation must be listed — the validator rejects incomplete mappings.
 *
 * @author Samchon
 */
export interface AutoBeRealizeCollectorMapping {
  /**
   * Exact field or relation name from Prisma schema (case-sensitive).
   *
   * **Examples**:
   *
   * ```typescript
   * // Scalar fields
   * { member: "id", kind: "scalar", nullable: false, how: "Generate with v4()" }
   * { member: "email", kind: "scalar", nullable: false, how: "From props.body.email" }
   * { member: "created_at", kind: "scalar", nullable: false, how: "Default to new Date()" }
   * { member: "description", kind: "scalar", nullable: true, how: "From props.body.description ?? null" }
   *
   * // BelongsTo relations — use Prisma RELATION name, NOT FK column name
   * { member: "customer", kind: "belongsTo", nullable: false, how: "Connect using props.customer.id" }
   * { member: "parent", kind: "belongsTo", nullable: true, how: "Undefined (nullable FK)" }
   *
   * // HasMany relations
   * { member: "tags", kind: "hasMany", nullable: null, how: "Nested create with TagCollector" }
   * { member: "comments", kind: "hasMany", nullable: null, how: "Not needed (optional has-many)" }
   * ```
   *
   * DO NOT use FK column names (e.g., "customer_id" is WRONG — use "customer").
   * Include ALL members even if unused in this collector.
   */
  member: string;

  /**
   * Kind of Prisma schema member.
   *
   * - `"scalar"`: Regular column → direct value assignment
   * - `"belongsTo"`: FK relation → `{ connect: { id } }`
   * - `"hasOne"`: 1:1 relation this side owns
   * - `"hasMany"`: 1:N or M:N → `{ create: [...] }` or omit
   *
   * The kind forces explicit classification BEFORE deciding how to handle it,
   * preventing confusion like treating belongsTo relations as scalar fields.
   */
  kind: "scalar" | "belongsTo" | "hasOne" | "hasMany";

  /**
   * Whether nullable in Prisma schema.
   *
   * - `false`: Non-nullable — must provide value
   * - `true`: Nullable — use `?? null` for scalar, `undefined` for belongsTo
   * - `null`: Not applicable (hasMany/hasOne)
   */
  nullable: boolean | null;

  /**
   * Brief strategy for obtaining this field's value (NOT code).
   *
   * Write phase: "Generate with v4()", "From props.body.email", "Connect using
   * props.customer.id", "Nested create with TagCollector".
   *
   * Correct phase: "No change needed", "Fix: Wrong name 'x' → 'y'".
   *
   * Even if correct or unused, you MUST include it. This ensures complete
   * schema coverage.
   */
  how: string;
}
export namespace AutoBeRealizeCollectorMapping {
  export type Metadata = Omit<AutoBeRealizeCollectorMapping, "how">;
}
