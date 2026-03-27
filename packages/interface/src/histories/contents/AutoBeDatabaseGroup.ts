import { tags } from "typia";

/**
 * Database component skeleton generated during the DATABASE_GROUP phase.
 *
 * Field order is deliberate: reasoning fields (thinking → review → rationale)
 * come BEFORE technical fields (namespace → filename → kind) to ensure the AI
 * reasons through purpose before committing to technical details.
 *
 * @author Samchon
 */
export interface AutoBeDatabaseGroup {
  /** Initial thoughts on why these tables belong together. */
  thinking: string;

  /**
   * Review considerations: relationships with other domains, grouping
   * validation.
   */
  review: string;

  /** Final rationale cementing the component's structure. */
  rationale: string;

  /**
   * Business domain namespace for Prisma @namespace directive.
   *
   * Examples: "Systematic", "Actors", "Sales", "Orders", "Articles".
   */
  namespace: string;

  /**
   * Prisma schema filename. Convention: `schema-{number}-{domain}.prisma` where
   * number indicates dependency order.
   */
  filename: string & tags.Pattern<"^[a-zA-Z0-9._-]+\\.prisma$">;

  /**
   * Component group kind.
   *
   * - `"authorization"`: Auth tables (users, sessions, password resets).
   *   Processed by Authorization Agent.
   * - `"domain"`: Business tables (products, orders). Processed by Component
   *   Agent.
   */
  kind: "authorization" | "domain";
}
