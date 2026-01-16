/**
 * Revision command to remove an existing property from a DTO schema.
 *
 * This revision type represents an atomic "delete property" operation that
 * completely removes a field from both the `properties` object and the
 * `required` array. This is the most destructive revision type and is
 * used only when a property definitively should not exist.
 *
 * ## When This Revision is Used
 *
 * ### Phantom Field Detection
 * Property doesn't exist in the database schema referenced by
 * `x-autobe-database-schema`. The most common phantom fields are:
 *
 * ```typescript
 * // Database has only created_at, but DTO assumed all timestamps
 * "updatedAt"  // PHANTOM - delete
 * "deletedAt"  // PHANTOM - delete
 * ```
 *
 * **CRITICAL**: Never assume tables have updated_at/deleted_at. Always
 * verify against actual database schema.
 *
 * ### Security Violation - Authentication Context
 * Actor identification fields must not appear in request DTOs because
 * they are injected from JWT/session, not provided by client:
 *
 * ```typescript
 * // IArticle.ICreate should NOT have:
 * "authorId"     // Injected from authenticated user
 * "memberId"     // Injected from member session
 * "bbs_member_id" // Same, in snake_case
 * ```
 *
 * ### Path Parameter Duplication
 * Field already provided via URL path parameter:
 *
 * ```typescript
 * // PUT /articles/{articleId}/comments/{id}
 * // IComment.IUpdate should NOT have:
 * "articleId"  // Already in path
 * "id"         // Already in path
 * ```
 *
 * ### System-Managed Fields in Create DTOs
 * Auto-generated fields that clients cannot set:
 *
 * ```typescript
 * // IUser.ICreate should NOT have:
 * "id"         // Auto-generated UUID
 * "createdAt"  // Auto-generated timestamp
 * "updatedAt"  // System-managed
 * ```
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaPropertyErase {
  /**
   * Discriminator identifying this as a property removal command.
   */
  type: "erase";

  /**
   * Human-readable explanation of why this property is being removed.
   *
   * Should clearly describe the security or structural issue that requires
   * removal. Examples:
   * - "Phantom field: 'updated_at' does not exist in database model User"
   * - "Security: 'bbs_member_id' is auth context, injected from JWT"
   * - "Path duplication: 'article_id' already in URL path parameter"
   * - "System-managed: 'id' is auto-generated, cannot be set by client"
   */
  reason: string;

  /**
   * Property key (name) to remove from the schema.
   *
   * This property will be deleted from `schema.properties[key]` and
   * also removed from `schema.required` array if present.
   */
  key: string;
}
