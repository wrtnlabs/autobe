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
  member: string;

  /**
   * The kind of Prisma schema member.
   *
   * Explicitly identifies whether this member is a scalar field or a relation,
   * and if it's a relation, what type of relation it is. This classification
   * forces the AI to think through the nature of each member before planning
   * how to handle it, preventing common mistakes like treating belongsTo
   * relations as scalar fields.
   *
   * **Possible values**:
   *
   * - `"scalar"`: Regular database column (id, email, created_at, total_price,
   *   etc.)
   * - `"belongsTo"`: Foreign key relation pointing to parent entity (customer,
   *   article, category, etc.)
   * - `"hasOne"`: One-to-one relation where this side owns the relationship
   * - `"hasMany"`: One-to-many or many-to-many relation (comments, tags, reviews,
   *   etc.)
   *
   * **Why this matters**:
   *
   * - **Prevents confusion**: AI must consciously identify if "customer" is a
   *   relation (needs `{ connect: { id: ... } }`) or a scalar field
   * - **Forces correct syntax**: belongsTo requires `connect`, hasMany requires
   *   `create`, scalar requires direct value assignment
   * - **Enables Chain-of-Thought**: AI explicitly thinks about the kind before
   *   deciding the handling strategy in the `how` field
   * - **Catches common errors**: Prevents treating FK relations as scalar IDs
   *
   * **Examples by kind**:
   *
   * ```typescript
   * // Scalar fields
   * { member: "id", kind: "scalar", nullable: false, how: "Generate with v4()" }
   * { member: "email", kind: "scalar", nullable: false, how: "From props.body.email" }
   * { member: "created_at", kind: "scalar", nullable: false, how: "Default to new Date()" }
   * { member: "description", kind: "scalar", nullable: true, how: "From props.body.description ?? null" }
   *
   * // BelongsTo relations (FK pointing to parent)
   * { member: "customer", kind: "belongsTo", nullable: false, how: "Connect using props.customer.id" }
   * { member: "article", kind: "belongsTo", nullable: false, how: "Connect using props.article.id" }
   * { member: "parent", kind: "belongsTo", nullable: true, how: "Undefined (nullable FK)" }
   *
   * // HasMany relations (reverse side of FK)
   * { member: "comments", kind: "hasMany", nullable: null, how: "Not needed (optional has-many)" }
   * { member: "tags", kind: "hasMany", nullable: null, how: "Nested create with TagCollector" }
   * { member: "reviews", kind: "hasMany", nullable: null, how: "Not applicable for this collector" }
   * ```
   *
   * The `kind` field works together with `nullable` and `how`: kind identifies
   * WHAT it is, nullable identifies IF it's optional, how explains HOW to
   * handle it.
   */
  kind: "scalar" | "belongsTo" | "hasOne" | "hasMany";

  /**
   * Whether this member is nullable in the Prisma schema.
   *
   * This property explicitly documents whether a field/relation can be null,
   * forcing the AI to understand nullability constraints before deciding how to
   * handle the member. This prevents errors like assigning null to non-nullable
   * fields or forgetting to handle optional relations properly.
   *
   * **Value semantics by kind**:
   *
   * - **For scalar fields** (`kind: "scalar"`):
   *
   *   - `false`: Non-nullable column (e.g., `email String`, `id String`)
   *
   *       - Must always have a value
   *       - Cannot use `null` or `undefined`
   *       - Example: `email: props.body.email` (required)
   *   - `true`: Nullable column (e.g., `description String?`, `deleted_at
   *       DateTime?`)
   *
   *       - Can be null
   *       - Use `?? null` pattern for optional DTO values
   *       - Example: `description: props.body.description ?? null`
   * - **For belongsTo relations** (`kind: "belongsTo"`):
   *
   *   - `false`: Required foreign key (e.g., `customer_id String`)
   *
   *       - Must always connect to parent entity
   *       - Cannot use `undefined`
   *       - Example: `customer: { connect: { id: props.customer.id } }`
   *   - `true`: Optional foreign key (e.g., `parent_id String?`, `category_id
   *       String?`)
   *
   *       - Can be omitted
   *       - Use `undefined` (NOT `null`) when not provided
   *       - Example: `parent: props.body.parentId ? { connect: { id:
   *               props.body.parentId } } : undefined`
   * - **For hasMany/hasOne relations** (`kind: "hasMany"` or `kind: "hasOne"`):
   *
   *   - Always `null`: Nullability concept doesn't apply to relation arrays/objects
   *
   *       - HasMany: Always optional (empty array or nested creates)
   *       - HasOne: Handled differently (create or omit)
   *       - The `nullable` property has no semantic meaning for these kinds
   *
   * **Why this matters**:
   *
   * - **Prevents null assignment errors**: Can't assign null to non-nullable
   *   fields
   * - **Forces correct optional handling**: nullable: true → use `?? null` or
   *   `undefined`
   * - **Catches required field omissions**: nullable: false → must provide value
   * - **Enables proper FK handling**: nullable belongsTo → use `undefined` not
   *   `null`
   * - **Supports Chain-of-Thought**: AI must think about nullability BEFORE
   *   deciding handling strategy
   *
   * **Examples**:
   *
   * ```typescript
   * // Non-nullable scalar (nullable: false)
   * { member: "id", kind: "scalar", nullable: false, how: "Generate with v4()" }
   * { member: "email", kind: "scalar", nullable: false, how: "From props.body.email" }
   * { member: "created_at", kind: "scalar", nullable: false, how: "Default to new Date()" }
   *
   * // Nullable scalar (nullable: true)
   * { member: "description", kind: "scalar", nullable: true, how: "From props.body.description ?? null" }
   * { member: "deleted_at", kind: "scalar", nullable: true, how: "Default to null" }
   * { member: "completed_at", kind: "scalar", nullable: true, how: "From props.body.completedAt ?? null" }
   *
   * // Required belongsTo (nullable: false)
   * { member: "customer", kind: "belongsTo", nullable: false, how: "Connect using props.customer.id" }
   * { member: "article", kind: "belongsTo", nullable: false, how: "Connect using props.article.id" }
   *
   * // Optional belongsTo (nullable: true)
   * { member: "parent", kind: "belongsTo", nullable: true, how: "Undefined (nullable FK)" }
   * { member: "category", kind: "belongsTo", nullable: true, how: "Connect using props.body.categoryId or undefined" }
   *
   * // HasMany relations (nullable: null - not applicable)
   * { member: "comments", kind: "hasMany", nullable: null, how: "Not needed (optional has-many)" }
   * { member: "tags", kind: "hasMany", nullable: null, how: "Nested create with TagCollector" }
   * { member: "reviews", kind: "hasMany", nullable: null, how: "Not applicable for this collector" }
   * ```
   *
   * The `nullable` property works with `kind` to determine the correct Prisma
   * syntax: kind identifies WHAT it is, nullable identifies IF it's optional,
   * how explains HOW to handle it.
   */
  nullable: boolean | null;

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
export namespace AutoBeRealizeCollectorMapping {
  export type Metadata = Omit<AutoBeRealizeCollectorMapping, "how">;
}
