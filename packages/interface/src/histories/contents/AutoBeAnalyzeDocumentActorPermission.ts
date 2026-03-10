import { ITraceable } from "./AutoBeAnalyzeDocumentTraceable";

/**
 * Action permission entry within a capability.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentActorPermissionAction {
  /** Action name (e.g., "create", "read", "update", "delete") */
  action: string;
  /** Whether allowed */
  allowed: boolean;
  /** Condition for conditional access (e.g., "own resources only") */
  conditions?: string;
}

/**
 * Per-actor capability permission mapping.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentActorPermissionEntry extends ITraceable {
  /** Actor name (matches AutoBeAnalyzeActor.name) */
  actor: string;
  /** Target capability name */
  capability: string;
  /** Allow/deny action list */
  actions: Array<AutoBeAnalyzeDocumentActorPermissionAction>;
}

/**
 * Extension category: Actor Permission Matrix.
 *
 * Structures per-actor capability permission mappings as business-level access
 * control descriptions.
 *
 * Optional category: selected for projects with complex permission models.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentActorPermission {
  /** Per-actor permission mapping */
  permissions: Array<AutoBeAnalyzeDocumentActorPermissionEntry>;
}
