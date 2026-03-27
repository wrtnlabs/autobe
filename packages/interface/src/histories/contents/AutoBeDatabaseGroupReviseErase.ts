/**
 * Remove a group from the component skeleton list.
 *
 * @author Michael
 */
export interface AutoBeDatabaseGroupReviseErase {
  /** Type discriminator. */
  type: "erase";

  /** Why this group should be removed. Keep concise. */
  reason: string;

  /** Namespace of the group to remove. Must match exactly. */
  namespace: string;
}
