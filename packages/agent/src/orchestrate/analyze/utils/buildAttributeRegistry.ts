import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeWriteSectionEvent,
} from "@autobe/interface";

// ─── Attribute Canonical Registry ───

/**
 * A single entry in the Attribute Canonical Registry.
 *
 * Tracks the first full specification of an Entity.attribute across all files,
 * enabling downstream section writes to reference rather than re-define.
 */
export interface IAttributeRegistryEntry {
  /** Entity name, e.g. "User" */
  entity: string;
  /** Attribute name, e.g. "email" */
  attribute: string;
  /** Full specification, e.g. "text(5-255), required, unique, RFC 5322" */
  fullSpec: string;
  /** Which file defined it, e.g. "05-core-domain-model.md" */
  definedInFile: string;
  /** Which section defined it, e.g. "User Registration" */
  definedInSection: string;
}

const DOWNSTREAM_CONTEXT_REGEX =
  /\*\*\[DOWNSTREAM CONTEXT\]\*\*([\s\S]*?)\n---/g;

const CROSS_REFERENCE_PATTERN = /\((?:defined in|see)\s+["']?[^)]+["']?\)/i;

/**
 * Build an Attribute Canonical Registry from completed file states.
 *
 * Scans all DOWNSTREAM CONTEXT Bridge Blocks across completed files and
 * extracts the first full specification for each Entity.attribute.
 * Cross-references (e.g., "(defined in ...)") are skipped.
 *
 * The registry follows "first writer wins" — the first file/section to fully
 * specify an attribute owns it.
 */
export const buildAttributeRegistry = (props: {
  files: Array<{
    file: AutoBeAnalyzeFile.Scenario;
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
  }>;
}): IAttributeRegistryEntry[] => {
  const registry: Map<string, IAttributeRegistryEntry> = new Map();

  for (const { file, sectionEvents } of props.files) {
    for (const sectionsForModule of sectionEvents) {
      for (const sectionEvent of sectionsForModule) {
        for (const section of sectionEvent.sectionSections) {
          const specs = extractAttributeSpecs(section.content);
          for (const { key, entity, attribute, specification } of specs) {
            if (!registry.has(key)) {
              registry.set(key, {
                entity,
                attribute,
                fullSpec: specification,
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

/**
 * Format the registry as a prompt-injectable text block.
 *
 * Produces a concise summary that tells the LLM which attributes are already
 * defined and where, so it can use reference format instead of re-defining.
 */
export const formatRegistryForPrompt = (
  registry: IAttributeRegistryEntry[],
): string => {
  if (registry.length === 0) {
    return "";
  }

  const lines: string[] = [
    "## CANONICAL ATTRIBUTE REGISTRY (READ-ONLY — do NOT redefine)",
    "",
    "The following Entity.attribute specifications are already defined in other sections.",
    "In your [DOWNSTREAM CONTEXT] Bridge Block, use ONLY the reference format for these:",
    '`- Entity.attribute: (defined in "Section Name")`',
    "",
  ];

  // Group by entity for readability
  const byEntity: Map<string, IAttributeRegistryEntry[]> = new Map();
  for (const entry of registry) {
    if (!byEntity.has(entry.entity)) byEntity.set(entry.entity, []);
    byEntity.get(entry.entity)!.push(entry);
  }

  for (const [entity, entries] of byEntity) {
    lines.push(`**${entity}**:`);
    for (const entry of entries) {
      lines.push(
        `  - ${entity}.${entry.attribute}: ${entry.fullSpec} (defined in "${entry.definedInSection}" of ${entry.definedInFile})`,
      );
    }
  }

  return lines.join("\n");
};

// ─── Internal helpers ───

function extractAttributeSpecs(content: string): Array<{
  key: string;
  entity: string;
  attribute: string;
  specification: string;
}> {
  const results: Array<{
    key: string;
    entity: string;
    attribute: string;
    specification: string;
  }> = [];
  const matches = content.matchAll(DOWNSTREAM_CONTEXT_REGEX);

  for (const match of matches) {
    const block = match[1] ?? "";
    const lines = block.split("\n");
    let inAttributes = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.startsWith("**Attributes Specified**")) {
        inAttributes = true;
        continue;
      }
      if (
        line.startsWith("**") &&
        !line.startsWith("**Attributes Specified**")
      ) {
        inAttributes = false;
        continue;
      }
      if (!inAttributes || !line.startsWith("-")) continue;

      const body = line.replace(/^-+\s*/, "");
      const colonIndex = body.indexOf(":");
      if (colonIndex < 0) continue;

      const key = body.slice(0, colonIndex).trim();
      const value = body.slice(colonIndex + 1).trim();

      // Skip cross-references
      if (CROSS_REFERENCE_PATTERN.test(value)) continue;
      // Skip "None"
      if (/^none$/i.test(value)) continue;
      // Only Entity.attribute format
      if (!key.includes(".")) continue;

      const dotIndex = key.indexOf(".");
      const entity = key.slice(0, dotIndex);
      const attribute = key.slice(dotIndex + 1);

      results.push({ key, entity, attribute, specification: value });
    }
  }

  return results;
}
