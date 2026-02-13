import { AutoBeDatabaseGroup } from "./AutoBeDatabaseGroup";

/**
 * Request to create a new group in the component skeleton list.
 *
 * Use this when you identify a missing business domain group that should exist
 * based on requirements analysis. Common scenarios:
 *
 * - A business domain was not identified during initial group generation
 * - A domain was incorrectly merged into another group and needs separation
 * - Requirements analysis reveals additional functional areas
 *
 * @author Michael
 */
export interface AutoBeDatabaseGroupReviseCreate {
  /** Type discriminator indicating this is a create operation. */
  type: "create";

  /**
   * Brief, concise reason for creating this group.
   *
   * Explain which business domain this group covers and why it was missing from
   * the initial generation.
   *
   * **IMPORTANT**: Keep it **concise** - one or two sentences maximum
   */
  reason: string;

  /**
   * The new group to add.
   *
   * Must be a complete AutoBeDatabaseGroup with all required fields.
   */
  group: AutoBeDatabaseGroup;
}
