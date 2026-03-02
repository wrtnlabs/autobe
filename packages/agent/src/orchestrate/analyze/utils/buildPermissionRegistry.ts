import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeWriteSectionEvent,
} from "@autobe/interface";
import YAML from "yaml";

// ─── YAML-based Permission Canonical Registry ───

/**
 * A single canonical permission entry extracted from a YAML spec block in
 * 01-actors-and-auth.
 */
export interface IPermissionRegistryEntry {
  /** Actor name, e.g. "member" */
  actor: string;
  /** Resource name, e.g. "Todo" */
  resource: string;
  /** Allowed actions, e.g. ["create", "read-own", "update-own", "delete-own"] */
  actions: string[];
}

/**
 * A reference to a permission found via backtick `actor:resource:action`
 * pattern.
 */
export interface IPermissionReference {
  actor: string;
  resource: string;
  action: string;
  fileIndex: number;
  sectionTitle: string;
}

/** Result of comparing canonical permission definitions to backtick references. */
export interface IPermissionValidationResult {
  /** All canonical permissions from 01-actors-and-auth YAML blocks */
  canonical: IPermissionRegistryEntry[];
  /** All backtick permission references in other files */
  references: IPermissionReference[];
  /** References where the action is not in the canonical allowed list */
  unauthorizedReferences: IPermissionReference[];
  /** YAML parse errors */
  parseErrors: Array<{
    fileIndex: number;
    sectionTitle: string;
    error: string;
  }>;
}

// ─── YAML Block Extraction ───

const YAML_CODE_BLOCK_REGEX = /```yaml\n([\s\S]*?)```/g;

/**
 * Extract canonical permission entries from 01-actors-and-auth YAML blocks.
 *
 * Expects YAML blocks with structure:
 *
 * ```yaml
 * permissions:
 *   - actor: member
 *     resource: Todo
 *     actions: [create, read-own, update-own, delete-own]
 * ```
 */
const extractCanonicalPermissions = (
  fileIndex: number,
  sectionEvents: AutoBeAnalyzeWriteSectionEvent[][],
): {
  entries: IPermissionRegistryEntry[];
  errors: Array<{ fileIndex: number; sectionTitle: string; error: string }>;
} => {
  const entries: IPermissionRegistryEntry[] = [];
  const errors: Array<{
    fileIndex: number;
    sectionTitle: string;
    error: string;
  }> = [];

  for (const sectionsForModule of sectionEvents) {
    for (const sectionEvent of sectionsForModule) {
      for (const section of sectionEvent.sectionSections) {
        const yamlMatches = section.content.matchAll(YAML_CODE_BLOCK_REGEX);
        for (const match of yamlMatches) {
          const yamlContent = match[1] ?? "";
          try {
            const parsed = YAML.parse(yamlContent);
            if (
              parsed &&
              typeof parsed === "object" &&
              Array.isArray(parsed.permissions)
            ) {
              for (const perm of parsed.permissions) {
                if (
                  perm &&
                  typeof perm.actor === "string" &&
                  typeof perm.resource === "string" &&
                  Array.isArray(perm.actions)
                ) {
                  entries.push({
                    actor: perm.actor,
                    resource: perm.resource,
                    actions: perm.actions.map(String),
                  });
                }
              }
            }
          } catch (e) {
            errors.push({
              fileIndex,
              sectionTitle: section.title,
              error: `YAML parse error: ${e instanceof Error ? e.message : String(e)}`,
            });
          }
        }
      }
    }
  }

  return { entries, errors };
};

// ─── Backtick Reference Extraction ───

/** Match backtick `actor:resource:action` patterns */
const BACKTICK_PERMISSION_REGEX = /`(\w+):(\w+):(\w[\w-]*)`/g;

/** Extract backtick `actor:resource:action` references from section content. */
const extractBacktickPermissionReferences = (
  fileIndex: number,
  sectionEvents: AutoBeAnalyzeWriteSectionEvent[][],
): IPermissionReference[] => {
  const refs: IPermissionReference[] = [];

  for (const sectionsForModule of sectionEvents) {
    for (const sectionEvent of sectionsForModule) {
      for (const section of sectionEvent.sectionSections) {
        const matches = section.content.matchAll(BACKTICK_PERMISSION_REGEX);
        for (const match of matches) {
          refs.push({
            actor: match[1]!,
            resource: match[2]!,
            action: match[3]!,
            fileIndex,
            sectionTitle: section.title,
          });
        }
      }
    }
  }

  return refs;
};

// ─── Main Validation Function ───

/**
 * Validate permission references across files using YAML canonical definitions.
 *
 * 1. Extracts canonical permissions from 01-actors-and-auth YAML blocks
 * 2. Extracts backtick `actor:resource:action` references from 03/04
 * 3. Reports unauthorized references (action not in canonical allowed list)
 */
export const validatePermissions = (props: {
  files: Array<{
    file: AutoBeAnalyzeFile.Scenario;
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
  }>;
}): IPermissionValidationResult => {
  let canonical: IPermissionRegistryEntry[] = [];
  const parseErrors: IPermissionValidationResult["parseErrors"] = [];

  // Extract canonical from 01-actors-and-auth
  const actorsAuthIndex = props.files.findIndex(
    (f) => f.file.filename === "01-actors-and-auth.md",
  );

  if (actorsAuthIndex >= 0) {
    const result = extractCanonicalPermissions(
      actorsAuthIndex,
      props.files[actorsAuthIndex]!.sectionEvents,
    );
    canonical = result.entries;
    parseErrors.push(...result.errors);
  }

  // Build canonical lookup: "actor:resource" → Set<action>
  const canonicalMap = new Map<string, Set<string>>();
  for (const entry of canonical) {
    const key = `${entry.actor.toLowerCase()}:${entry.resource}`;
    if (!canonicalMap.has(key)) canonicalMap.set(key, new Set());
    for (const action of entry.actions) {
      canonicalMap.get(key)!.add(action.toLowerCase());
    }
  }

  // Extract references from 03/04
  const references: IPermissionReference[] = [];
  for (let i = 0; i < props.files.length; i++) {
    const filename = props.files[i]!.file.filename;
    if (
      filename === "03-functional-requirements.md" ||
      filename === "04-business-rules.md"
    ) {
      references.push(
        ...extractBacktickPermissionReferences(
          i,
          props.files[i]!.sectionEvents,
        ),
      );
    }
  }

  // Find unauthorized references
  const unauthorizedReferences = references.filter((ref) => {
    const key = `${ref.actor.toLowerCase()}:${ref.resource}`;
    const allowedActions = canonicalMap.get(key);
    if (!allowedActions) return true; // actor:resource not defined at all
    return !allowedActions.has(ref.action.toLowerCase());
  });

  return { canonical, references, unauthorizedReferences, parseErrors };
};

// ─── Legacy exports (kept for backward compatibility) ───

/** @deprecated Bridge block registry removed. Use validatePermissions() instead. */
export const buildPermissionRegistry = (props: {
  files: Array<{
    file: AutoBeAnalyzeFile.Scenario;
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
  }>;
}): IPermissionRegistryEntry[] => {
  const result = validatePermissions(props);
  return result.canonical;
};

/** @deprecated Bridge block injection removed. */
export const formatPermissionRegistryForPrompt = (
  _registry: IPermissionRegistryEntry[],
): string => {
  return "";
};
