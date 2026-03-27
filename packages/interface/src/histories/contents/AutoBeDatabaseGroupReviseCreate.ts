import { AutoBeDatabaseGroup } from "./AutoBeDatabaseGroup";

/**
 * Add a missing group to the component skeleton list.
 *
 * @author Michael
 */
export interface AutoBeDatabaseGroupReviseCreate {
  /** Type discriminator. */
  type: "create";

  /** Why this group is needed. Keep concise. */
  reason: string;

  /** The new group to add (complete AutoBeDatabaseGroup). */
  group: AutoBeDatabaseGroup;
}
