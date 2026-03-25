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
   * Exact Prisma field or relation name (case-sensitive).
   *
   * Use relation names (e.g., "customer"), NOT FK column names (e.g.,
   * "customer_id"). Include ALL members even if unused in this collector.
   */
  member: string;

  /**
   * Kind of Prisma schema member.
   *
   * - `"scalar"`: Regular column (id, email, created_at)
   * - `"belongsTo"`: FK relation to parent → use `{ connect: { id } }`
   * - `"hasOne"`: 1:1 relation this side owns
   * - `"hasMany"`: 1:N or M:N relation → use `{ create: [...] }` or omit
   */
  kind: "scalar" | "belongsTo" | "hasOne" | "hasMany";

  /**
   * Whether nullable in Prisma schema.
   *
   * - `false`: Non-nullable (must provide value)
   * - `true`: Nullable (use `?? null` for scalar, `undefined` for belongsTo)
   * - `null`: Not applicable (hasMany/hasOne — always set to `null`)
   */
  nullable: boolean | null;

  /**
   * Brief strategy for obtaining this field's value (NOT code).
   *
   * Write phase: "Generate with v4()", "From props.body.email", "Connect using
   * props.customer.id", "Nested create with TagCollector".
   *
   * Correct phase: "No change needed", "Fix: Wrong name 'x' → 'y'".
   */
  how: string;
}
export namespace AutoBeRealizeCollectorMapping {
  export type Metadata = Omit<AutoBeRealizeCollectorMapping, "how">;
}
