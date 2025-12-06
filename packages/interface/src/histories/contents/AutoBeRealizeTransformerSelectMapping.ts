/**
 * Single Prisma field selection mapping for the select() function.
 *
 * Documents which Prisma fields/relations must be selected from the database to
 * enable the transform() function to build the DTO. This structured approach
 * ensures no required data is missing from the query, preventing runtime
 * errors.
 *
 * **Purpose**:
 *
 * - Prevents missing field selections through systematic coverage verification
 * - Forces explicit decision-making for each Prisma field selection
 * - Ensures select() and transform() are perfectly aligned
 * - Creates clear documentation of what data to load from database
 *
 * **Usage Contexts**:
 *
 * - **Write Phase**: Plan which Prisma fields to select for each DTO property
 * - **Correct Phase**: Document current state and correction plan for each
 *   selection
 *
 * The validator cross-checks mappings against the Prisma schema and DTO
 * requirements to ensure nothing is overlooked, rejecting incomplete
 * selections.
 *
 * **Critical Principle**:
 *
 * Every DTO property in the transform() function requires corresponding Prisma
 * data. This mapping documents what must be selected to satisfy those
 * requirements. If transform() needs `prisma.created_at`, select() MUST include
 * `created_at: true`.
 *
 * @author Samchon
 */
export interface AutoBeRealizeTransformerSelectMapping {
  /**
   * Exact Prisma field or relation name from the Prisma schema.
   *
   * MUST match the Prisma schema exactly (case-sensitive). Use snake_case as
   * Prisma follows database conventions.
   *
   * **Field Types**:
   *
   * - **Scalar fields**: Database columns (id, email, created_at, unit_price,
   *   etc.)
   * - **BelongsTo relations**: Foreign key relations (customer, article,
   *   category, etc.)
   * - **HasMany relations**: One-to-many arrays (tags, comments, reviews, etc.)
   * - **Aggregations**: Prisma computed fields (_count, _sum, _avg, etc.)
   *
   * **Examples**:
   *
   * ```typescript
   * // Scalar fields for direct mapping or conversion
   * { member: "id", kind: "scalar", nullable: false, how: "For DTO.id" }
   * { member: "email", kind: "scalar", nullable: false, how: "For DTO.email" }
   * { member: "created_at", kind: "scalar", nullable: false, how: "For DTO.createdAt (needs .toISOString())" }
   * { member: "unit_price", kind: "scalar", nullable: false, how: "For DTO.price (Decimal → Number)" }
   * { member: "deleted_at", kind: "scalar", nullable: true, how: "For DTO.deletedAt (nullable DateTime)" }
   *
   * // Scalar fields for computation
   * { member: "quantity", kind: "scalar", nullable: false, how: "For DTO.totalPrice computation" }
   * { member: "expiry_date", kind: "scalar", nullable: false, how: "For DTO.isExpired computation" }
   *
   * // Aggregations (special scalar type)
   * { member: "_count", kind: "scalar", nullable: false, how: "For DTO.reviewCount" }
   *
   * // BelongsTo relations (nested objects)
   * { member: "customer", kind: "belongsTo", nullable: false, how: "For DTO.customer (nested transformer)" }
   * { member: "article", kind: "belongsTo", nullable: false, how: "For DTO.article (nested transformer)" }
   * { member: "parent", kind: "belongsTo", nullable: true, how: "For DTO.parent (optional nested)" }
   *
   * // HasMany relations (arrays)
   * { member: "tags", kind: "hasMany", nullable: null, how: "For DTO.tags (array transformer)" }
   * { member: "comments", kind: "hasMany", nullable: null, how: "For DTO.comments (array transformer)" }
   * ```
   *
   * DO NOT use DTO property names here - this is about Prisma schema members,
   * not DTO properties.
   */
  member: string;

  /**
   * The kind of Prisma schema member being selected.
   *
   * Explicitly identifies whether this member is a scalar field or a relation,
   * and if it's a relation, what type of relation it is. This classification
   * forces the AI to think through the nature of each member before planning
   * what to select, preventing common mistakes in the select() function.
   *
   * **Possible values**:
   *
   * - `"scalar"`: Regular database column (id, email, created_at, unit_price,
   *   etc.)
   * - `"belongsTo"`: Foreign key relation pointing to parent entity (customer,
   *   article, category, etc.)
   * - `"hasOne"`: One-to-one relation where this side owns the relationship
   * - `"hasMany"`: One-to-many or many-to-many relation (comments, tags, reviews,
   *   etc.)
   *
   * **Why this matters for select()**:
   *
   * - **Prevents confusion**: AI must consciously identify if "customer" is a
   *   scalar or belongsTo relation
   * - **Forces correct select syntax**: belongsTo/hasMany require nested select
   *   objects, scalar requires `true`
   * - **Enables Chain-of-Thought**: AI explicitly thinks about the kind before
   *   deciding selection strategy
   * - **Supports proper data loading**: Different kinds require different
   *   selection approaches
   *
   * **Examples by kind**:
   *
   * ```typescript
   * // Scalar fields - simple selection
   * { member: "id", kind: "scalar", nullable: false, how: "For DTO.id" }
   * { member: "email", kind: "scalar", nullable: false, how: "For DTO.email" }
   * { member: "created_at", kind: "scalar", nullable: false, how: "For DTO.createdAt" }
   * { member: "deleted_at", kind: "scalar", nullable: true, how: "For DTO.deletedAt" }
   *
   * // BelongsTo relations - nested selection with transformer
   * { member: "customer", kind: "belongsTo", nullable: false, how: "For DTO.customer (nested)" }
   * { member: "article", kind: "belongsTo", nullable: false, how: "For DTO.article (nested)" }
   * { member: "parent", kind: "belongsTo", nullable: true, how: "For DTO.parent (optional)" }
   *
   * // HasMany relations - nested selection with array transformer
   * { member: "tags", kind: "hasMany", nullable: null, how: "For DTO.tags (array)" }
   * { member: "comments", kind: "hasMany", nullable: null, how: "For DTO.comments (array)" }
   * ```
   *
   * The `kind` field works together with `nullable` and `how`: kind identifies
   * WHAT it is, nullable identifies IF it's optional, how explains WHY we're
   * selecting it.
   */
  kind: "scalar" | "belongsTo" | "hasOne" | "hasMany";

  /**
   * Whether this Prisma member is nullable in the schema.
   *
   * This property explicitly documents whether a field/relation can be null,
   * forcing the AI to understand nullability constraints before deciding
   * selection strategy. This affects how the transform() function will handle
   * the data.
   *
   * **Value semantics by kind**:
   *
   * - **For scalar fields** (`kind: "scalar"`):
   *
   *   - `false`: Non-nullable column (e.g., `email String`, `id String`)
   *
   *       - Will always have a value in the selected data
   *       - Transform() can safely access without null checks
   *       - Example: `created_at DateTime` → `nullable: false`
   *   - `true`: Nullable column (e.g., `deleted_at DateTime?`)
   *
   *       - Might be null in the selected data
   *       - Transform() must handle null case (e.g., `?? null`)
   *       - Example: `deleted_at DateTime?` → `nullable: true`
   * - **For belongsTo relations** (`kind: "belongsTo"`):
   *
   *   - `false`: Required foreign key (e.g., `customer_id String`)
   *
   *       - Relation will always exist in the selected data
   *       - Transform() can safely use the nested transformer
   *       - Example: `customer` relation → `nullable: false`
   *   - `true`: Optional foreign key (e.g., `parent_id String?`)
   *
   *       - Relation might not exist in the selected data
   *       - Transform() must handle null case
   *       - Example: `parent` relation → `nullable: true`
   * - **For hasMany/hasOne relations** (`kind: "hasMany"` or `kind: "hasOne"`):
   *
   *   - Always `null`: Nullability concept doesn't apply to these relations
   *
   *       - HasMany: Always returns array (empty or populated)
   *       - HasOne: Handled differently in Prisma
   *       - The `nullable` property has no semantic meaning
   *
   * **Why this matters for select()**:
   *
   * - **Informs transform() handling**: Knowing nullability helps plan correct
   *   transformation
   * - **Validates selection strategy**: Nullable fields need different handling
   *   in transform()
   * - **Supports Chain-of-Thought**: AI must think about nullability BEFORE
   *   deciding selection
   * - **Documents schema constraints**: Makes nullability explicit for validation
   *
   * **Examples**:
   *
   * ```typescript
   * // Non-nullable scalar (nullable: false)
   * { member: "id", kind: "scalar", nullable: false, how: "For DTO.id" }
   * { member: "email", kind: "scalar", nullable: false, how: "For DTO.email" }
   * { member: "created_at", kind: "scalar", nullable: false, how: "For DTO.createdAt" }
   *
   * // Nullable scalar (nullable: true)
   * { member: "deleted_at", kind: "scalar", nullable: true, how: "For DTO.deletedAt (nullable)" }
   * { member: "description", kind: "scalar", nullable: true, how: "For DTO.description (optional)" }
   *
   * // Required belongsTo (nullable: false)
   * { member: "customer", kind: "belongsTo", nullable: false, how: "For DTO.customer (nested)" }
   * { member: "article", kind: "belongsTo", nullable: false, how: "For DTO.article (nested)" }
   *
   * // Optional belongsTo (nullable: true)
   * { member: "parent", kind: "belongsTo", nullable: true, how: "For DTO.parent (optional)" }
   * { member: "category", kind: "belongsTo", nullable: true, how: "For DTO.category (optional)" }
   *
   * // HasMany relations (nullable: null - not applicable)
   * { member: "comments", kind: "hasMany", nullable: null, how: "For DTO.comments (array)" }
   * { member: "tags", kind: "hasMany", nullable: null, how: "For DTO.tags (array)" }
   * ```
   *
   * The `nullable` property works with `kind` and `how`: kind identifies WHAT
   * it is, nullable identifies IF it's optional, how explains WHY we're
   * selecting it.
   */
  nullable: boolean | null;

  /**
   * Brief one-line explanation of why this Prisma field is being selected.
   *
   * Keep it concise and clear. Focus on which DTO property(ies) need this data.
   *
   * **For Write Phase** (planning field selection):
   *
   * - "For DTO.id"
   * - "For DTO.email"
   * - "For DTO.createdAt (needs .toISOString())"
   * - "For DTO.deletedAt (nullable DateTime)"
   * - "For DTO.price (Decimal → Number conversion)"
   * - "For DTO.totalPrice computation (with quantity)"
   * - "For DTO.reviewCount aggregation"
   * - "For DTO.isExpired computation"
   * - "For DTO.customer (nested CustomerTransformer)"
   * - "For DTO.tags (array TagTransformer)"
   * - "For nested transformer's select() requirements"
   *
   * **For Correct Phase** (documenting current state and fixes):
   *
   * - "No change needed - correct"
   * - "Already correct"
   * - "Fix: Wrong field name 'user_email' → 'email'"
   * - "Fix: Missing field - add for DTO.totalPrice"
   * - "Fix: Should use select, not include"
   * - "Fix: Missing aggregation - add _count"
   * - "Fix: Fabricated field - remove it"
   * - "Fix: Selecting unused field - remove it"
   *
   * Even if a selection is correct, you MUST include it in the mapping and
   * explain why. This ensures complete coverage and alignment with
   * transform().
   *
   * This is NOT code - just a simple description of the selection purpose.
   */
  how: string;
}
export namespace AutoBeRealizeTransformerSelectMapping {
  export type Metadata = Omit<AutoBeRealizeTransformerSelectMapping, "how">;
}
