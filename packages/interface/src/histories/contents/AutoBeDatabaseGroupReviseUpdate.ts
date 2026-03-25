import { AutoBeDatabaseGroup } from "./AutoBeDatabaseGroup";

/**
 * Fix an existing group's properties (namespace, filename, kind, reasoning).
 *
 * @author Michael
 */
export interface AutoBeDatabaseGroupReviseUpdate {
  /** Type discriminator. */
  type: "update";

  /** Why this fix is needed. Keep concise. */
  reason: string;

  /** Namespace of the original group. Must match exactly. */
  originalNamespace: string;

  /** Updated group definition (complete AutoBeDatabaseGroup). */
  group: AutoBeDatabaseGroup;
}
