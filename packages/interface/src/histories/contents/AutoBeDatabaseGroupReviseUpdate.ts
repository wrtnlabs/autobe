import { AutoBeDatabaseGroup } from "./AutoBeDatabaseGroup";

/**
 * Request to update an existing group in the component skeleton list.
 *
 * Use this when a group has issues that need correction:
 *
 * - Namespace naming convention violations
 * - Filename format issues
 * - Incorrect kind assignment (authorization vs domain)
 * - Domain scope needs adjustment (thinking/review/rationale updates)
 *
 * @author Michael
 */
export interface AutoBeDatabaseGroupReviseUpdate {
  /** Type discriminator indicating this is an update operation. */
  type: "update";

  /**
   * Brief, concise reason for this update.
   *
   * Explain what issue this fixes and why the change is necessary.
   *
   * **IMPORTANT**: Keep it **concise** - one or two sentences maximum
   */
  reason: string;

  /**
   * The namespace of the original group to modify.
   *
   * Must match exactly an existing group's namespace.
   */
  original_namespace: string;

  /**
   * The updated group definition.
   *
   * Must be a complete AutoBeDatabaseGroup with all required fields.
   */
  group: AutoBeDatabaseGroup;
}
