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

// ─── Structured Conflict Detection ───

export interface IConstraintConflict {
  key: string;
  values: Array<{
    display: string;
    files: string[];
  }>;
}

/**
 * Detect numeric constraint conflicts across files as structured data.
 *
 * Returns an array of conflicts where the same constraint key has different
 * normalized values across files. Used by the orchestrator to programmatically
 * determine whether cross-file rejection should be authoritative.
 */
export const detectConstraintConflicts = (props: {
  files: Array<{
    file: AutoBeAnalyzeFile.Scenario;
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
  }>;
}): IConstraintConflict[] => {
  const constraints: Map<string, ConstraintEntry> = new Map();

  for (const { file, sectionEvents } of props.files) {
    for (const sectionsForModule of sectionEvents) {
      for (const sectionEvent of sectionsForModule) {
        for (const section of sectionEvent.sectionSections) {
          const pairs = extractConstraints(section.content);
          for (const { key, value } of pairs) {
            const normalized = normalizeValue(value);
            if (!constraints.has(key)) {
              constraints.set(key, { key, values: new Map() });
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

  return [...constraints.values()]
    .filter((entry) => entry.values.size > 1)
    .map((entry) => ({
      key: entry.key,
      values: [...entry.values.values()].map((v) => ({
        display: v.display,
        files: [...new Set(v.sources.map((s) => s.file.filename))],
      })),
    }));
};

/**
 * Build a map from filename → list of conflict feedback strings.
 *
 * For each file that participates in at least one constraint conflict,
 * generates human-readable feedback describing what conflicts exist.
 */
export const buildFileConflictMap = (
  conflicts: IConstraintConflict[],
): Map<string, string[]> => {
  const map: Map<string, string[]> = new Map();

  for (const conflict of conflicts) {
    const allFiles = new Set(conflict.values.flatMap((v) => v.files));
    const feedback =
      `${conflict.key} has conflicting values: ` +
      conflict.values
        .map((v) => `"${v.display}" in [${v.files.join(", ")}]`)
        .join(" vs ");

    for (const filename of allFiles) {
      if (!map.has(filename)) map.set(filename, []);
      map.get(filename)!.push(feedback);
    }
  }

  return map;
};

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

const CROSS_REFERENCE_PATTERN = /\((?:defined in|see)\s+["']?[^)]+["']?\)/i;

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

// ─── Attribute Duplicate Detection (Structured) ───

export interface IAttributeDuplicate {
  key: string;
  files: string[];
  /** Whether the specifications differ across files (not just duplicated) */
  hasValueConflict: boolean;
  /** Different specification values when hasValueConflict is true */
  values?: Array<{
    specification: string;
    files: string[];
  }>;
}

/**
 * Detect cross-file attribute duplication as structured data.
 *
 * Returns an array of attributes that are fully specified (not
 * cross-referenced) in more than one file. Additionally detects whether the
 * specifications differ across files (value conflict) vs just being duplicated
 * (same value).
 */
export const detectAttributeDuplicates = (props: {
  files: Array<{
    file: AutoBeAnalyzeFile.Scenario;
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
  }>;
}): IAttributeDuplicate[] => {
  // key → { filename → Set<normalized specification> }
  const attributes: Map<
    string,
    Map<string, { normalized: string; display: string; files: Set<string> }>
  > = new Map();
  const allFilesByKey: Map<string, Set<string>> = new Map();

  for (const { file, sectionEvents } of props.files) {
    for (const sectionsForModule of sectionEvents) {
      for (const sectionEvent of sectionsForModule) {
        for (const section of sectionEvent.sectionSections) {
          const specs = extractAttributeSpecs(section.content);
          for (const { key, specification } of specs) {
            if (!allFilesByKey.has(key)) allFilesByKey.set(key, new Set());
            allFilesByKey.get(key)!.add(file.filename);

            if (!attributes.has(key)) attributes.set(key, new Map());
            const specMap = attributes.get(key)!;
            const normalized = normalizeValue(specification);
            if (!specMap.has(normalized)) {
              specMap.set(normalized, {
                normalized,
                display: specification.trim(),
                files: new Set(),
              });
            }
            specMap.get(normalized)!.files.add(file.filename);
          }
        }
      }
    }
  }

  return [...allFilesByKey.entries()]
    .filter(([, files]) => files.size > 1)
    .map(([key, files]) => {
      const specMap = attributes.get(key)!;
      const hasValueConflict = specMap.size > 1;
      return {
        key,
        files: [...files],
        hasValueConflict,
        ...(hasValueConflict
          ? {
              values: [...specMap.values()].map((v) => ({
                specification: v.display,
                files: [...v.files],
              })),
            }
          : {}),
      };
    });
};

/**
 * Build a map from filename → list of attribute duplication feedback strings.
 *
 * Produces more specific feedback when value conflicts are detected (different
 * specifications across files) vs simple duplication (same specification).
 */
export const buildFileAttributeDuplicateMap = (
  duplicates: IAttributeDuplicate[],
): Map<string, string[]> => {
  const map: Map<string, string[]> = new Map();

  for (const dup of duplicates) {
    let feedback: string;
    if (dup.hasValueConflict && dup.values) {
      feedback =
        `${dup.key} has conflicting specifications across files: ` +
        dup.values
          .map((v) => `"${v.specification}" in [${v.files.join(", ")}]`)
          .join(" vs ") +
        `. Align to ONE canonical definition.`;
    } else {
      feedback =
        `${dup.key} is fully specified in multiple files: [${dup.files.join(", ")}]. ` +
        `Only ONE file should contain the full spec; others must use reference format: ` +
        `"(defined in ...)"`;
    }

    for (const filename of dup.files) {
      if (!map.has(filename)) map.set(filename, []);
      map.get(filename)!.push(feedback);
    }
  }

  return map;
};

// ─── Enum Conflict Detection ───

const ENUM_PATTERN = /enum\s*[\(\[\{]([^)\]\}]+)[\)\]\}]/i;

export interface IEnumConflict {
  /** Entity.attribute key, e.g. "User.status" */
  key: string;
  /** Different enum value sets found across files */
  values: Array<{
    /** Normalized sorted enum set, e.g. "active|deleted" */
    enumSet: string;
    /** Original display text */
    display: string;
    /** Files where this set appears */
    files: string[];
  }>;
}

/**
 * Extract enum specifications from Bridge Block content.
 *
 * Only extracts entries in `**Attributes Specified**` that contain an explicit
 * `enum(...)` / `enum[...]` / `enum{...}` pattern. Cross-references and "None"
 * entries are skipped.
 */
const extractEnumSpecs = (
  content: string,
): Array<{ key: string; enumSet: string; display: string }> => {
  const results: Array<{ key: string; enumSet: string; display: string }> = [];
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

      // Extract enum pattern
      const enumMatch = value.match(ENUM_PATTERN);
      if (!enumMatch) continue;

      const rawEnumValues = enumMatch[1]!;
      // Normalize: lowercase, split by pipe/comma, sort, dedupe
      const enumSet = [
        ...new Set(
          rawEnumValues
            .split(/[|,]/)
            .map((v) => v.trim().toLowerCase())
            .filter((v) => v.length > 0),
        ),
      ]
        .sort()
        .join("|");

      results.push({ key, enumSet, display: value.trim() });
    }
  }

  return results;
};

type EnumSource = {
  file: AutoBeAnalyzeFile.Scenario;
  sectionTitle: string;
};

type EnumValue = {
  enumSet: string;
  display: string;
  sources: EnumSource[];
};

type EnumEntry = {
  key: string;
  values: Map<string, EnumValue>;
};

/**
 * Detect enum value conflicts across files as structured data.
 *
 * Scans [DOWNSTREAM CONTEXT] Bridge Blocks for `enum(...)` patterns in
 * **Attributes Specified** fields. When the same Entity.attribute has different
 * enum value sets across files, it's reported as a conflict.
 *
 * Only matches explicit `enum(val1|val2|...)` syntax — no keyword heuristics.
 */
export const detectEnumConflicts = (props: {
  files: Array<{
    file: AutoBeAnalyzeFile.Scenario;
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
  }>;
}): IEnumConflict[] => {
  const enums: Map<string, EnumEntry> = new Map();

  for (const { file, sectionEvents } of props.files) {
    for (const sectionsForModule of sectionEvents) {
      for (const sectionEvent of sectionsForModule) {
        for (const section of sectionEvent.sectionSections) {
          const specs = extractEnumSpecs(section.content);
          for (const { key, enumSet, display } of specs) {
            if (!enums.has(key)) {
              enums.set(key, { key, values: new Map() });
            }
            const entry = enums.get(key)!;
            if (!entry.values.has(enumSet)) {
              entry.values.set(enumSet, {
                enumSet,
                display,
                sources: [],
              });
            }
            entry.values.get(enumSet)!.sources.push({
              file,
              sectionTitle: section.title,
            });
          }
        }
      }
    }
  }

  return [...enums.values()]
    .filter((entry) => entry.values.size > 1)
    .map((entry) => ({
      key: entry.key,
      values: [...entry.values.values()].map((v) => ({
        enumSet: v.enumSet,
        display: v.display,
        files: [...new Set(v.sources.map((s) => s.file.filename))],
      })),
    }));
};

/** Build a map from filename → list of enum conflict feedback strings. */
export const buildFileEnumConflictMap = (
  conflicts: IEnumConflict[],
): Map<string, string[]> => {
  const map: Map<string, string[]> = new Map();

  for (const conflict of conflicts) {
    const allFiles = new Set(conflict.values.flatMap((v) => v.files));
    const feedback =
      `${conflict.key} has conflicting enum values: ` +
      conflict.values
        .map((v) => `enum(${v.enumSet}) in [${v.files.join(", ")}]`)
        .join(" vs ");

    for (const filename of allFiles) {
      if (!map.has(filename)) map.set(filename, []);
      map.get(filename)!.push(feedback);
    }
  }

  return map;
};

/**
 * Build a human-readable enum consistency report for cross-file review.
 *
 * Parallel to `buildConstraintConsistencyReport` (numeric) — this one covers
 * enum value conflicts.
 */
export const buildEnumConsistencyReport = (props: {
  files: Array<{
    file: AutoBeAnalyzeFile.Scenario;
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
  }>;
}): string => {
  let totalEnums: number = 0;
  const enums: Map<string, EnumEntry> = new Map();

  for (const { file, sectionEvents } of props.files) {
    for (const sectionsForModule of sectionEvents) {
      for (const sectionEvent of sectionsForModule) {
        for (const section of sectionEvent.sectionSections) {
          const specs = extractEnumSpecs(section.content);
          for (const { key, enumSet, display } of specs) {
            totalEnums++;
            if (!enums.has(key)) {
              enums.set(key, { key, values: new Map() });
            }
            const entry = enums.get(key)!;
            if (!entry.values.has(enumSet)) {
              entry.values.set(enumSet, {
                enumSet,
                display,
                sources: [],
              });
            }
            entry.values.get(enumSet)!.sources.push({
              file,
              sectionTitle: section.title,
            });
          }
        }
      }
    }
  }

  const conflicts = [...enums.values()].filter(
    (entry) => entry.values.size > 1,
  );

  if (conflicts.length === 0) {
    return [
      "No enum value conflicts detected.",
      `Scanned ${totalEnums} enum specifications from [DOWNSTREAM CONTEXT] blocks.`,
    ].join("\n");
  }

  const lines: string[] = [
    `Detected ${conflicts.length} enum value conflict(s).`,
    `Scanned ${totalEnums} enum specifications from [DOWNSTREAM CONTEXT] blocks.`,
    "",
    "Enum Conflicts:",
  ];

  for (const entry of conflicts) {
    lines.push(`- ${entry.key}:`);
    for (const value of entry.values.values()) {
      const sources = value.sources
        .map((s) => `${s.file.filename} → ${s.sectionTitle}`)
        .slice(0, 6)
        .join("; ");
      lines.push(`  - enum(${value.enumSet}) (e.g., ${sources})`);
    }
  }

  return lines.join("\n");
};

// ─── Permission Rule Conflict Detection ───

export interface IPermissionConflict {
  /** E.g. "admin → CreateTodo" */
  actorOperation: string;
  rules: Array<{
    condition: string;
    files: string[];
  }>;
}

/**
 * Extract permission rules from Bridge Block content.
 *
 * Parses `**Permission Rules**` entries in format: `- actor → operation →
 * condition`
 */
const extractPermissionRules = (
  content: string,
): Array<{ actorOperation: string; condition: string }> => {
  const results: Array<{ actorOperation: string; condition: string }> = [];
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
      // Expected format: "actor → operation → condition"
      // Split by arrow (→ or ->)
      const parts = body.split(/\s*(?:→|->)\s*/);
      if (parts.length < 3) continue;

      const actor = parts[0]!.trim().toLowerCase();
      const operation = parts[1]!.trim();
      const condition = parts.slice(2).join(" → ").trim().toLowerCase();

      if (!actor || !operation || !condition) continue;

      results.push({
        actorOperation: `${actor} → ${operation}`,
        condition,
      });
    }
  }

  return results;
};

const DENIED_PATTERNS = /^(denied|blocked|forbidden|not allowed|prohibited)/i;
const ALLOWED_PATTERNS =
  /^(allowed|authenticated|always|yes|permitted|authorized|no authentication|owner)/i;

/** Classify a permission condition as "denied", "allowed", or "other". */
const classifyPermission = (
  condition: string,
): "denied" | "allowed" | "other" => {
  if (DENIED_PATTERNS.test(condition)) return "denied";
  if (ALLOWED_PATTERNS.test(condition)) return "allowed";
  return "other";
};

/**
 * Detect permission rule conflicts across files.
 *
 * A conflict occurs when the same `actor → operation` combination has
 * contradictory conditions: one file says "denied/blocked" while another says
 * "allowed/authenticated".
 */
export const detectPermissionConflicts = (props: {
  files: Array<{
    file: AutoBeAnalyzeFile.Scenario;
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
  }>;
}): IPermissionConflict[] => {
  // actorOperation → condition → Set<filename>
  const ruleMap: Map<string, Map<string, Set<string>>> = new Map();

  for (const { file, sectionEvents } of props.files) {
    for (const sectionsForModule of sectionEvents) {
      for (const sectionEvent of sectionsForModule) {
        for (const section of sectionEvent.sectionSections) {
          const rules = extractPermissionRules(section.content);
          for (const { actorOperation, condition } of rules) {
            if (!ruleMap.has(actorOperation))
              ruleMap.set(actorOperation, new Map());
            const condMap = ruleMap.get(actorOperation)!;
            if (!condMap.has(condition)) condMap.set(condition, new Set());
            condMap.get(condition)!.add(file.filename);
          }
        }
      }
    }
  }

  const conflicts: IPermissionConflict[] = [];

  for (const [actorOperation, condMap] of ruleMap) {
    if (condMap.size < 2) continue;

    // Check if there's a true contradiction (denied vs allowed)
    const entries = [...condMap.entries()];
    const classifications = entries.map(([cond, files]) => ({
      condition: cond,
      classification: classifyPermission(cond),
      files: [...files],
    }));

    const hasDenied = classifications.some(
      (c) => c.classification === "denied",
    );
    const hasAllowed = classifications.some(
      (c) => c.classification === "allowed",
    );

    if (hasDenied && hasAllowed) {
      conflicts.push({
        actorOperation,
        rules: classifications.map((c) => ({
          condition: c.condition,
          files: c.files,
        })),
      });
    }
  }

  return conflicts;
};

/** Build a map from filename → list of permission conflict feedback strings. */
export const buildFilePermissionConflictMap = (
  conflicts: IPermissionConflict[],
): Map<string, string[]> => {
  const map: Map<string, string[]> = new Map();

  for (const conflict of conflicts) {
    const allFiles = new Set(conflict.rules.flatMap((r) => r.files));
    const feedback =
      `Permission conflict for "${conflict.actorOperation}": ` +
      conflict.rules
        .map((r) => `"${r.condition}" in [${r.files.join(", ")}]`)
        .join(" vs ");

    for (const filename of allFiles) {
      if (!map.has(filename)) map.set(filename, []);
      map.get(filename)!.push(feedback);
    }
  }

  return map;
};

// ─── State Field Conflict Detection ───

export interface IStateFieldConflict {
  entity: string;
  conflictType: string;
  fields: Array<{
    fieldName: string;
    specification: string;
    files: string[];
  }>;
}

/**
 * Detect state field conflicts across files.
 *
 * Known contradiction patterns:
 *
 * 1. Same entity has both `deletedAt` (datetime) and `isDeleted` (boolean)
 * 2. Same entity has `status` (enum) and semantically equivalent `is*` booleans
 */
export const detectStateFieldConflicts = (props: {
  files: Array<{
    file: AutoBeAnalyzeFile.Scenario;
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
  }>;
}): IStateFieldConflict[] => {
  // entity → { fieldName → { specification, files } }
  const entityFields: Map<
    string,
    Map<string, { specification: string; files: Set<string> }>
  > = new Map();

  for (const { file, sectionEvents } of props.files) {
    for (const sectionsForModule of sectionEvents) {
      for (const sectionEvent of sectionsForModule) {
        for (const section of sectionEvent.sectionSections) {
          const specs = extractAttributeSpecs(section.content);
          for (const { key, specification } of specs) {
            const dotIndex = key.indexOf(".");
            if (dotIndex < 0) continue;
            const entity = key.slice(0, dotIndex);
            const field = key.slice(dotIndex + 1).toLowerCase();

            if (!entityFields.has(entity)) entityFields.set(entity, new Map());
            const fields = entityFields.get(entity)!;
            if (!fields.has(field))
              fields.set(field, { specification, files: new Set() });
            fields.get(field)!.files.add(file.filename);
          }
        }
      }
    }
  }

  const conflicts: IStateFieldConflict[] = [];

  for (const [entity, fields] of entityFields) {
    const fieldNames = [...fields.keys()];

    // Pattern 1: deletedAt + isDeleted on same entity
    const hasDeletedAt = fieldNames.some(
      (f) => f === "deletedat" || f === "deleted_at",
    );
    const hasIsDeleted = fieldNames.some(
      (f) => f === "isdeleted" || f === "is_deleted",
    );

    if (hasDeletedAt && hasIsDeleted) {
      const deletedAtField =
        fields.get("deletedat") ?? fields.get("deleted_at");
      const isDeletedField =
        fields.get("isdeleted") ?? fields.get("is_deleted");

      if (deletedAtField && isDeletedField) {
        conflicts.push({
          entity,
          conflictType: "deletedAt vs isDeleted",
          fields: [
            {
              fieldName: "deletedAt",
              specification: deletedAtField.specification,
              files: [...deletedAtField.files],
            },
            {
              fieldName: "isDeleted",
              specification: isDeletedField.specification,
              files: [...isDeletedField.files],
            },
          ],
        });
      }
    }

    // Pattern 2: status (enum) + is* booleans that overlap semantically
    const statusField = fields.get("status");
    if (statusField && /enum/i.test(statusField.specification)) {
      const isBooleans = fieldNames.filter(
        (f) =>
          f.startsWith("is") && /boolean/i.test(fields.get(f)!.specification),
      );

      // Check if any is* boolean is semantically covered by the status enum
      for (const boolField of isBooleans) {
        // Extract the concept: isDeleted → deleted, isPublished → published
        const concept = boolField.slice(2).toLowerCase();
        if (statusField.specification.toLowerCase().includes(concept)) {
          const boolEntry = fields.get(boolField)!;
          conflicts.push({
            entity,
            conflictType: `status enum includes "${concept}" but separate is${concept.charAt(0).toUpperCase() + concept.slice(1)} boolean also exists`,
            fields: [
              {
                fieldName: "status",
                specification: statusField.specification,
                files: [...statusField.files],
              },
              {
                fieldName: boolField,
                specification: boolEntry.specification,
                files: [...boolEntry.files],
              },
            ],
          });
        }
      }
    }
  }

  return conflicts;
};

/** Build a map from filename → list of state field conflict feedback strings. */
export const buildFileStateFieldConflictMap = (
  conflicts: IStateFieldConflict[],
): Map<string, string[]> => {
  const map: Map<string, string[]> = new Map();

  for (const conflict of conflicts) {
    const allFiles = new Set(conflict.fields.flatMap((f) => f.files));
    const feedback =
      `State field conflict for "${conflict.entity}": ${conflict.conflictType}. ` +
      conflict.fields
        .map(
          (f) =>
            `"${f.fieldName}: ${f.specification}" in [${f.files.join(", ")}]`,
        )
        .join(" vs ") +
      `. Use ONE canonical approach.`;

    for (const filename of allFiles) {
      if (!map.has(filename)) map.set(filename, []);
      map.get(filename)!.push(feedback);
    }
  }

  return map;
};

// ─── Attribute Specs Extraction (shared) ───

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
