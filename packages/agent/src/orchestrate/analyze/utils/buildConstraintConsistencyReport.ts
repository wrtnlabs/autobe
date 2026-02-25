import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeWriteSectionEvent,
} from "@autobe/interface";

type ConstraintSource = {
  file: AutoBeAnalyzeFile.Scenario;
  sectionTitle: string;
};

type ConstraintValue = {
  normalized: string;
  display: string;
  sources: ConstraintSource[];
};

type ConstraintEntry = {
  key: string;
  values: Map<string, ConstraintValue>;
};

const DOWNSTREAM_CONTEXT_REGEX =
  /\*\*\[DOWNSTREAM CONTEXT\]\*\*([\s\S]*?)\n---/g;

export const buildConstraintConsistencyReport = (props: {
  files: Array<{
    file: AutoBeAnalyzeFile.Scenario;
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
  }>;
}): string => {
  const constraints: Map<string, ConstraintEntry> = new Map();
  let totalConstraints: number = 0;

  for (const { file, sectionEvents } of props.files) {
    for (const sectionsForModule of sectionEvents) {
      for (const sectionEvent of sectionsForModule) {
        for (const section of sectionEvent.sectionSections) {
          const pairs = extractConstraints(section.content);
          for (const { key, value } of pairs) {
            totalConstraints++;
            const normalized = normalizeValue(value);
            if (!constraints.has(key)) {
              constraints.set(key, {
                key,
                values: new Map(),
              });
            }
            const entry = constraints.get(key)!;
            if (!entry.values.has(normalized)) {
              entry.values.set(normalized, {
                normalized,
                display: value.trim(),
                sources: [],
              });
            }
            entry.values.get(normalized)!.sources.push({
              file,
              sectionTitle: section.title,
            });
          }
        }
      }
    }
  }

  const conflicts: ConstraintEntry[] = [...constraints.values()].filter(
    (entry) => entry.values.size > 1,
  );

  if (conflicts.length === 0) {
    return [
      "No numeric constraint conflicts detected.",
      `Scanned ${totalConstraints} numeric constraints from [DOWNSTREAM CONTEXT] blocks.`,
    ].join("\n");
  }

  const lines: string[] = [
    `Detected ${conflicts.length} numeric constraint conflict(s).`,
    `Scanned ${totalConstraints} numeric constraints from [DOWNSTREAM CONTEXT] blocks.`,
    "",
    "Conflicts:",
  ];

  for (const entry of conflicts) {
    lines.push(`- ${entry.key}:`);
    for (const value of entry.values.values()) {
      const sources = value.sources
        .map((s) => `${s.file.filename} → ${s.sectionTitle}`)
        .slice(0, 6)
        .join("; ");
      lines.push(`  - ${value.display} (e.g., ${sources})`);
    }
  }

  return lines.join("\n");
};

const extractConstraints = (
  content: string,
): Array<{ key: string; value: string }> => {
  const results: Array<{ key: string; value: string }> = [];
  const matches = content.matchAll(DOWNSTREAM_CONTEXT_REGEX);
  for (const match of matches) {
    const block = match[1] ?? "";
    const lines = block.split("\n");
    let category: "attributes" | "validation" | "other" = "other";
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.startsWith("**Attributes Specified**")) {
        category = "attributes";
        continue;
      }
      if (line.startsWith("**Validation Rules**")) {
        category = "validation";
        continue;
      }
      if (!line.startsWith("-")) continue;
      const body = line.replace(/^-+\s*/, "");
      const colonIndex = body.indexOf(":");
      if (colonIndex < 0) continue;
      const key = body.slice(0, colonIndex).trim();
      const value = body.slice(colonIndex + 1).trim();
      if (!hasNumeric(value)) continue;
      const normalizedKey =
        category === "validation" && key.includes(".") === false
          ? `validation.${key}`
          : key;
      results.push({ key: normalizedKey, value });
    }
  }
  return results;
};

const normalizeValue = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim();

const hasNumeric = (value: string): boolean => /\d/.test(value);

// ─── Attribute Ownership Report ───

type AttributeSource = {
  filename: string;
  sectionTitle: string;
  specification: string;
};

type AttributeOwnership = {
  key: string;
  fullSpecs: AttributeSource[];
};

const CROSS_REFERENCE_PATTERN =
  /\((?:defined in|see)\s+["']?[^)]+["']?\)/i;

export const buildAttributeOwnershipReport = (props: {
  files: Array<{
    file: AutoBeAnalyzeFile.Scenario;
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
  }>;
}): string => {
  const attributes: Map<string, AttributeOwnership> = new Map();
  let totalAttributes: number = 0;

  for (const { file, sectionEvents } of props.files) {
    for (const sectionsForModule of sectionEvents) {
      for (const sectionEvent of sectionsForModule) {
        for (const section of sectionEvent.sectionSections) {
          const specs = extractAttributeSpecs(section.content);
          for (const { key, specification } of specs) {
            totalAttributes++;
            if (!attributes.has(key)) {
              attributes.set(key, { key, fullSpecs: [] });
            }
            attributes.get(key)!.fullSpecs.push({
              filename: file.filename,
              sectionTitle: section.title,
              specification,
            });
          }
        }
      }
    }
  }

  // Find attributes with full specs in more than one file
  const duplicates: AttributeOwnership[] = [...attributes.values()].filter(
    (entry) => {
      const uniqueFiles = new Set(entry.fullSpecs.map((s) => s.filename));
      return uniqueFiles.size > 1;
    },
  );

  if (duplicates.length === 0) {
    return [
      "No cross-file attribute duplication detected.",
      `Scanned ${totalAttributes} attribute specifications from [DOWNSTREAM CONTEXT] blocks.`,
    ].join("\n");
  }

  const lines: string[] = [
    `Detected ${duplicates.length} cross-file attribute duplication(s).`,
    `Scanned ${totalAttributes} attribute specifications from [DOWNSTREAM CONTEXT] blocks.`,
    "",
    "Duplicated Attributes:",
  ];

  for (const entry of duplicates) {
    lines.push(`- ${entry.key}:`);
    for (const source of entry.fullSpecs.slice(0, 6)) {
      lines.push(
        `  - Full spec in: ${source.filename} → "${source.sectionTitle}" (${source.specification})`,
      );
    }
    lines.push(
      `  → Should be fully specified in ONE file only. Other files should cross-reference.`,
    );
  }

  return lines.join("\n");
};

const extractAttributeSpecs = (
  content: string,
): Array<{ key: string; specification: string }> => {
  const results: Array<{ key: string; specification: string }> = [];
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

      // Skip cross-references like "(defined in ...)" or "(see ...)"
      if (CROSS_REFERENCE_PATTERN.test(value)) continue;

      // Skip "None" entries
      if (/^none$/i.test(value)) continue;

      // Only include entries with a dot (Entity.attribute format)
      if (!key.includes(".")) continue;

      results.push({ key, specification: value });
    }
  }
  return results;
};
