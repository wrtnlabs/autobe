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
   * Exact Prisma field or relation name (case-sensitive, snake_case).
   *
   * Scalar fields use `true`, relations use nested select objects. Aggregations
   * (_count, _sum, _avg) are treated as scalar. DO NOT use DTO property names —
   * this is about Prisma schema members.
   */
  member: string;

  /**
   * Kind of Prisma schema member.
   *
   * - `"scalar"`: Regular column → `{ field: true }`
   * - `"belongsTo"`: FK relation → `{ relation: { select: ... } }`
   * - `"hasOne"`: 1:1 relation → nested select
   * - `"hasMany"`: 1:N relation → `{ relation: { select: ... } }`
   */
  kind: "scalar" | "belongsTo" | "hasOne" | "hasMany";

  /**
   * Whether nullable in Prisma schema.
   *
   * - `false`: Always present in selected data
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
   */
  how: string;
}
export namespace AutoBeRealizeTransformerSelectMapping {
  export type Metadata = Omit<AutoBeRealizeTransformerSelectMapping, "how">;
}
