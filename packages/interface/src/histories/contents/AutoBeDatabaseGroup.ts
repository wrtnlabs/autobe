import { tags } from "typia";

/**
 * Database component skeleton generated during the DATABASE_GROUP phase.
 *
 * When requirements are too extensive to process at once, the DATABASE_GROUP
 * agent first generates multiple component skeletons that define the overall
 * database structure. Each skeleton specifies a Prisma schema file with its
 * reasoning and technical details, but WITHOUT the actual table definitions.
 *
 * ## Generation Process
 *
 * The AI agent analyzes business requirements and creates component skeletons
 * by:
 * 1. **Reasoning first**: Determining why certain tables belong together
 * 2. **Technical decisions second**: Choosing appropriate namespace and filename
 *
 * This skeleton will later be filled with table definitions in the
 * DATABASE_COMPONENT phase.
 *
 * ## Property Order Matters
 *
 * The field order is deliberately designed for function calling. The AI must
 * reason through the component's purpose (thinking → review → rationale) BEFORE
 * making technical commitments (namespace → filename).
 *
 * @author Samchon
 */
export interface AutoBeDatabaseGroup {
  /**
   * Initial thoughts on why these tables belong together.
   *
   * ⭐ **REASONING FIELD #1**: This field comes FIRST to ensure the AI reasons
   * through the component's purpose before determining technical details.
   * Function calling order matters - thinking drives decision-making.
   *
   * **Example:**
   *
   *     "These tables all relate to user management and authentication.
   *     They share common patterns like user identification and access control."
   */
  thinking: string;

  /**
   * Review considerations for this component grouping.
   *
   * ⭐ **REASONING FIELD #2**: After initial thinking, the AI reviews its
   * decisions by considering relationships with other domains and validating
   * the grouping strategy.
   *
   * **Example:**
   *
   *     "Reviewed relationships with other domains. While customers create orders,
   *     the customer entity itself is fundamentally about user identity, not sales."
   */
  review: string;

  /**
   * Final rationale for this component's composition.
   *
   * ⭐ **REASONING FIELD #3**: The conclusive reasoning that cements the
   * component's structure before committing to technical choices (namespace,
   * filename).
   *
   * **Example:**
   *
   *     "This component groups all actor-related tables to maintain a clear
   *     separation between identity management and business transactions."
   */
  rationale: string;

  /**
   * Business domain namespace that groups related models.
   *
   * 🔧 **TECHNICAL FIELD #1**: Determined AFTER reasoning is complete. Used in
   * Prisma documentation comments as "@\namespace directive". Examples:
   * "Systematic", "Actors", "Sales", "Carts", "Orders", "Coupons", "Coins",
   * "Inquiries", "Favorites", "Articles"
   */
  namespace: string;

  /**
   * Target filename for the Prisma schema file containing this component's
   * tables.
   *
   * 🔧 **TECHNICAL FIELD #2**: Determined AFTER reasoning and namespace are
   * complete. Follows the naming convention `schema-{number}-{domain}.prisma`
   * where the number indicates dependency order and domain represents the
   * business area.
   */
  filename: string & tags.Pattern<"^[a-zA-Z0-9._-]+\\.prisma$">;
}
