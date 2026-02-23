import { ITraceable } from "./AutoBeAnalyzeDocumentTraceable";

/**
 * Extension category: Actor Permission Matrix.
 *
 * Structures per-actor capability permission mappings as **direct input** for
 * permission verification in the Test/Interface Phase.
 *
 * Optional category: selected for projects with complex permission models.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentActorPermission {
  /** Per-actor permission mapping */
  permissions: Array<
    {
      /** Actor name (matches AutoBeAnalyzeActor.name) */
      actor: string;
      /** Target capability name */
      capability: string;
      /** Allow/deny action list */
      actions: Array<{
        /** Action name (e.g., "create", "read", "update", "delete") */
        action: string;
        /** Whether allowed */
        allowed: boolean;
        /** Condition for conditional access (e.g., "own resources only") */
        conditions?: string;
      }>;
    } & ITraceable
  >;
}
