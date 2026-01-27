/**
 * Request to erase a group from the component skeleton list.
 *
 * Use this when a group should be removed:
 *
 * - Group is unnecessary or redundant with another group
 * - Group does not correspond to any business domain in requirements
 * - Group was hallucinated and not derived from actual requirements
 * - Group's domain should be merged into another existing group
 *
 * @author Michael
 */
export interface AutoBeDatabaseGroupReviseErase {
  /** Type discriminator indicating this is an erase operation. */
  type: "erase";

  /**
   * Brief, concise reason for deletion.
   *
   * Explain why this group should be removed and what issue it causes.
   *
   * **IMPORTANT**: Keep it **concise** - one or two sentences maximum
   */
  reason: string;

  /**
   * The namespace of the group to remove.
   *
   * Must match exactly an existing group's namespace.
   */
  namespace: string;
}
