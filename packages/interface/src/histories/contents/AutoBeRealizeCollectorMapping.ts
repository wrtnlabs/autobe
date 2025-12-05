/**
 * Single field/relation mapping strategy for Prisma CreateInput generation.
 *
 * Documents the handling strategy for one specific field or relation in the
 * Prisma CreateInput. This structured approach ensures complete schema coverage
 * by requiring explicit documentation for EVERY field - including those not
 * used or not applicable.
 *
 * **Purpose**:
 *
 * - Prevents field omissions through systematic coverage verification
 * - Forces explicit decision-making for each Prisma schema member
 * - Enables validation before code generation (Write) or correction (Correct)
 * - Creates clear documentation of field handling strategy
 *
 * **Usage Contexts**:
 *
 * - **Write Phase**: Plan how to generate each field from DTO → Prisma
 * - **Correct Phase**: Document current state and correction plan for each field
 *
 * The validator cross-checks mappings against the Prisma schema to ensure
 * nothing is overlooked, rejecting incomplete mappings.
 *
 * @author Samchon
 */
export interface AutoBeRealizeCollectorMapping {
  /**
   * Exact field or relation name from Prisma schema.
   *
   * MUST match the schema exactly (case-sensitive). Examples:
   *
   * - Scalar fields: "id", "email", "created_at"
   * - BelongsTo relations: "customer", "article"
   * - HasMany relations: "comments", "shopping_sale_tags"
   *
   * DO NOT use database column names (e.g., "customer_id" is WRONG - use
   * "customer").
   *
   * Include ALL fields from the schema, even if they are optional or not used
   * in this particular collector.
   */
  prismaMember: string;

  kind: "scalar" | "belongsTo" | "hasOne" | "hasMany";

  /**
   * Brief one-line explanation of how to obtain this field's value.
   *
   * Keep it concise and clear.
   *
   * **For Write Phase** (planning field generation):
   *
   * - "Generate with v4()"
   * - "From props.body.email"
   * - "Connect using props.references.customer_id"
   * - "Nested create with ShoppingSaleTagCollector"
   * - "Query comment to get article_id"
   * - "Default to new Date()"
   * - "Undefined (nullable FK)"
   * - "Not applicable for this collector"
   * - "Not needed (optional has-many)"
   *
   * **For Correct Phase** (documenting current state and fixes):
   *
   * - "No change needed - correct"
   * - "Already correct"
   * - "Fix: Wrong name 'user_email' → 'email'"
   * - "Fix: Missing field - add with props.body.email"
   * - "Fix: Wrong type - change to connect syntax"
   * - "Fix: Should use CustomerCollector instead of inline"
   * - "Fix: Using null instead of undefined"
   * - "Fix: Fabricated field - remove it"
   *
   * Even if a field is correct or not used, you MUST include it in the mapping
   * and explain why. This ensures complete schema coverage.
   *
   * This is NOT code - just a simple description of the strategy.
   */
  how: string;
}
