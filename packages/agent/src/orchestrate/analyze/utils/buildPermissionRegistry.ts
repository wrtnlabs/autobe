import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeWriteSectionEvent,
} from "@autobe/interface";

// ─── Permission Canonical Registry ───

/**
 * A single entry in the Permission Canonical Registry.
 *
 * Tracks the first full specification of an actor→operation→condition rule,
 * enabling downstream section writes to reference rather than redefine.
 */
export interface IPermissionRegistryEntry {
  /** E.g. "admin" */
  actor: string;
  /** E.g. "CreateTodo" */
  operation: string;
  /** E.g. "authenticated required" or "denied" */
  condition: string;
  /** Which file defined it */
  definedInFile: string;
  /** Which section defined it */
  definedInSection: string;
}

const DOWNSTREAM_CONTEXT_REGEX =
  /\*\*\[DOWNSTREAM CONTEXT\]\*\*([\s\S]*?)\n---/g;

/**
 * Extract permission rules from a single Bridge Block content string.
 *
 * Parses `**Permission Rules**` entries in format: `- actor → operation →
 * condition`
 */
const extractPermissionRules = (
  content: string,
): Array<{ actor: string; operation: string; condition: string }> => {
  const results: Array<{
    actor: string;
    operation: string;
    condition: string;
  }> = [];
  const matches = content.matchAll(DOWNSTREAM_CONTEXT_REGEX);

  for (const match of matches) {
    const block = match[1] ?? "";
    const lines = block.split("\n");
    let inPermissions = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.startsWith("**Permission Rules**")) {
        inPermissions = true;
        continue;
      }
      if (line.startsWith("**") && !line.startsWith("**Permission Rules**")) {
        inPermissions = false;
        continue;
      }
      if (!inPermissions || !line.startsWith("-")) continue;

      const body = line.replace(/^-+\s*/, "");
      const parts = body.split(/\s*(?:→|->)\s*/);
      if (parts.length < 3) continue;

      const actor = parts[0]!.trim();
      const operation = parts[1]!.trim();
      const condition = parts.slice(2).join(" → ").trim();

      if (!actor || !operation || !condition) continue;

      results.push({ actor, operation, condition });
    }
  }

  return results;
};

/**
 * Build a Permission Canonical Registry from completed file states.
 *
 * Scans all DOWNSTREAM CONTEXT Bridge Blocks across completed files and
 * extracts the first permission rule for each actor→operation pair. The
 * registry follows "first writer wins".
 */
export const buildPermissionRegistry = (props: {
  files: Array<{
    file: AutoBeAnalyzeFile.Scenario;
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
  }>;
}): IPermissionRegistryEntry[] => {
  const registry: Map<string, IPermissionRegistryEntry> = new Map();

  for (const { file, sectionEvents } of props.files) {
    for (const sectionsForModule of sectionEvents) {
      for (const sectionEvent of sectionsForModule) {
        for (const section of sectionEvent.sectionSections) {
          const rules = extractPermissionRules(section.content);
          for (const { actor, operation, condition } of rules) {
            const key = `${actor.toLowerCase()} → ${operation}`;
            if (!registry.has(key)) {
              registry.set(key, {
                actor,
                operation,
                condition,
                definedInFile: file.filename,
                definedInSection: section.title,
              });
            }
          }
        }
      }
    }
  }

  return [...registry.values()];
};

/** Format the permission registry as a prompt-injectable text block. */
export const formatPermissionRegistryForPrompt = (
  registry: IPermissionRegistryEntry[],
): string => {
  if (registry.length === 0) {
    return "";
  }

  const lines: string[] = [
    "## CANONICAL PERMISSION REGISTRY (READ-ONLY — do NOT contradict)",
    "",
    "The following permission rules are already defined in other sections.",
    "Your Bridge Block MUST use the EXACT same condition for these actor→operation pairs:",
    "",
  ];

  // Group by operation for readability
  const byOperation: Map<string, IPermissionRegistryEntry[]> = new Map();
  for (const entry of registry) {
    if (!byOperation.has(entry.operation)) byOperation.set(entry.operation, []);
    byOperation.get(entry.operation)!.push(entry);
  }

  for (const [operation, entries] of byOperation) {
    lines.push(`**${operation}**:`);
    for (const entry of entries) {
      lines.push(
        `  - ${entry.actor} → ${entry.operation} → ${entry.condition} (defined in "${entry.definedInSection}" of ${entry.definedInFile})`,
      );
    }
  }

  return lines.join("\n");
};
