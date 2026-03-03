import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeWriteSectionEvent,
} from "@autobe/interface";
import YAML from "yaml";

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

const YAML_CODE_BLOCK_REGEX = /```yaml\n([\s\S]*?)```/g;

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
      `Scanned ${totalConstraints} numeric constraints from YAML spec blocks.`,
    ].join("\n");
  }

  const lines: string[] = [
    `Detected ${conflicts.length} numeric constraint conflict(s).`,
    `Scanned ${totalConstraints} numeric constraints from YAML spec blocks.`,
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

/**
 * Extract numeric constraints from YAML spec blocks.
 *
 * Parses YAML code blocks and extracts Entity.attribute constraints that
 * contain numeric values (e.g., length limits, quantity limits).
 */
const extractConstraints = (
  content: string,
): Array<{ key: string; value: string }> => {
  const results: Array<{ key: string; value: string }> = [];
  const yamlMatches = content.matchAll(YAML_CODE_BLOCK_REGEX);

  for (const match of yamlMatches) {
    const yamlContent = match[1] ?? "";
    try {
      const parsed = YAML.parse(yamlContent);
      if (!parsed || typeof parsed !== "object") continue;

      // Handle entity attribute YAML blocks
      if (
        typeof parsed.entity === "string" &&
        Array.isArray(parsed.attributes)
      ) {
        for (const attr of parsed.attributes) {
          if (!attr || typeof attr.name !== "string") continue;
          const constraintStr = String(attr.constraints ?? "");
          if (!hasNumeric(constraintStr)) continue;
          results.push({
            key: `${parsed.entity}.${attr.name}`,
            value: constraintStr,
          });
        }
      }

      // Handle error code YAML blocks (HTTP status codes)
      if (Array.isArray(parsed.errors)) {
        for (const err of parsed.errors) {
          if (!err || typeof err.code !== "string") continue;
          if (typeof err.http === "number") {
            results.push({
              key: `error.${err.code}.http`,
              value: String(err.http),
            });
          }
        }
      }
    } catch {
      // skip parse errors
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
 * normalized values across files.
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

/** Build a map from filename → list of conflict feedback strings. */
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

// ─── Attribute Duplicate Detection ───

export interface IAttributeDuplicate {
  key: string;
  files: string[];
  hasValueConflict: boolean;
  values?: Array<{
    specification: string;
    files: string[];
  }>;
}

/**
 * Detect cross-file attribute duplication from YAML spec blocks.
 *
 * Returns attributes that are defined in YAML blocks across multiple files.
 */
export const detectAttributeDuplicates = (props: {
  files: Array<{
    file: AutoBeAnalyzeFile.Scenario;
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
  }>;
}): IAttributeDuplicate[] => {
  // key → { normalized spec → { display, files } }
  const attributes: Map<
    string,
    Map<string, { display: string; files: Set<string> }>
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
        `Only ONE file should contain the full spec.`;
    }

    for (const filename of dup.files) {
      if (!map.has(filename)) map.set(filename, []);
      map.get(filename)!.push(feedback);
    }
  }

  return map;
};

// ─── Enum Conflict Detection ───

export interface IEnumConflict {
  key: string;
  values: Array<{
    enumSet: string;
    display: string;
    files: string[];
  }>;
}

/**
 * Detect enum value conflicts from YAML spec blocks.
 *
 * Scans YAML attribute blocks for enum-like constraints and detects when
 * different files define different enum value sets for the same attribute.
 */
export const detectEnumConflicts = (props: {
  files: Array<{
    file: AutoBeAnalyzeFile.Scenario;
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
  }>;
}): IEnumConflict[] => {
  type EnumValue = {
    enumSet: string;
    display: string;
    files: Set<string>;
  };
  const enums: Map<string, Map<string, EnumValue>> = new Map();

  for (const { file, sectionEvents } of props.files) {
    for (const sectionsForModule of sectionEvents) {
      for (const sectionEvent of sectionsForModule) {
        for (const section of sectionEvent.sectionSections) {
          const specs = extractEnumSpecs(section.content);
          for (const { key, enumSet, display } of specs) {
            if (!enums.has(key)) enums.set(key, new Map());
            const entry = enums.get(key)!;
            if (!entry.has(enumSet)) {
              entry.set(enumSet, { enumSet, display, files: new Set() });
            }
            entry.get(enumSet)!.files.add(file.filename);
          }
        }
      }
    }
  }

  return [...enums.entries()]
    .filter(([, values]) => values.size > 1)
    .map(([key, values]) => ({
      key,
      values: [...values.values()].map((v) => ({
        enumSet: v.enumSet,
        display: v.display,
        files: [...v.files],
      })),
    }));
};

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

// ─── Permission Rule Conflict Detection ───

export interface IPermissionConflict {
  actorOperation: string;
  rules: Array<{
    condition: string;
    files: string[];
  }>;
}

/**
 * Detect permission rule conflicts from YAML spec blocks.
 *
 * A conflict occurs when one YAML block allows an action but another doesn't
 * include it for the same actor+resource.
 */
export const detectPermissionConflicts = (props: {
  files: Array<{
    file: AutoBeAnalyzeFile.Scenario;
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
  }>;
}): IPermissionConflict[] => {
  // actor:resource → action → Set<filename>
  const ruleMap: Map<string, Map<string, Set<string>>> = new Map();

  for (const { file, sectionEvents } of props.files) {
    for (const sectionsForModule of sectionEvents) {
      for (const sectionEvent of sectionsForModule) {
        for (const section of sectionEvent.sectionSections) {
          const rules = extractPermissionRulesFromYaml(section.content);
          for (const { actor, resource, actions } of rules) {
            const key = `${actor.toLowerCase()}:${resource}`;
            if (!ruleMap.has(key)) ruleMap.set(key, new Map());
            const actionMap = ruleMap.get(key)!;
            for (const action of actions) {
              const normAction = action.toLowerCase();
              if (!actionMap.has(normAction))
                actionMap.set(normAction, new Set());
              actionMap.get(normAction)!.add(file.filename);
            }
          }
        }
      }
    }
  }

  // Permission conflicts are rare in YAML-based approach since
  // 01-actors-and-auth is the canonical source. Return empty for now.
  return [];
};

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
 * Detect state field conflicts from YAML spec blocks.
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

    // Pattern 2: status (enum) + is* booleans
    const statusField = fields.get("status");
    if (statusField && /enum/i.test(statusField.specification)) {
      const isBooleans = fieldNames.filter(
        (f) =>
          f.startsWith("is") && /boolean/i.test(fields.get(f)!.specification),
      );

      for (const boolField of isBooleans) {
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

// ─── YAML-based Attribute Specs Extraction (shared) ───

const ENUM_PATTERN = /enum\s*[\(\[\{]([^)\]\}]+)[\)\]\}]/i;

/**
 * Extract attribute specs from YAML code blocks.
 *
 * Parses YAML blocks with `entity` + `attributes` structure and returns
 * Entity.attribute → constraints pairs.
 */
const extractAttributeSpecs = (
  content: string,
): Array<{ key: string; specification: string }> => {
  const results: Array<{ key: string; specification: string }> = [];
  const yamlMatches = content.matchAll(YAML_CODE_BLOCK_REGEX);

  for (const match of yamlMatches) {
    const yamlContent = match[1] ?? "";
    try {
      const parsed = YAML.parse(yamlContent);
      if (
        !parsed ||
        typeof parsed !== "object" ||
        typeof parsed.entity !== "string" ||
        !Array.isArray(parsed.attributes)
      )
        continue;

      for (const attr of parsed.attributes) {
        if (!attr || typeof attr.name !== "string") continue;
        const spec = [
          attr.type ? String(attr.type) : "",
          attr.constraints ? String(attr.constraints) : "",
        ]
          .filter(Boolean)
          .join(", ");
        if (!spec) continue;
        results.push({
          key: `${parsed.entity}.${attr.name}`,
          specification: spec,
        });
      }
    } catch {
      // skip parse errors
    }
  }

  return results;
};

/** Extract enum specs from YAML attribute blocks. */
const extractEnumSpecs = (
  content: string,
): Array<{ key: string; enumSet: string; display: string }> => {
  const results: Array<{ key: string; enumSet: string; display: string }> = [];
  const yamlMatches = content.matchAll(YAML_CODE_BLOCK_REGEX);

  for (const match of yamlMatches) {
    const yamlContent = match[1] ?? "";
    try {
      const parsed = YAML.parse(yamlContent);
      if (
        !parsed ||
        typeof parsed !== "object" ||
        typeof parsed.entity !== "string" ||
        !Array.isArray(parsed.attributes)
      )
        continue;

      for (const attr of parsed.attributes) {
        if (!attr || typeof attr.name !== "string") continue;
        const typeStr = String(attr.type ?? "");
        const constraintStr = String(attr.constraints ?? "");
        const combined = `${typeStr} ${constraintStr}`;

        const enumMatch = combined.match(ENUM_PATTERN);
        if (!enumMatch) continue;

        const rawEnumValues = enumMatch[1]!;
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

        results.push({
          key: `${parsed.entity}.${attr.name}`,
          enumSet,
          display: combined.trim(),
        });
      }
    } catch {
      // skip parse errors
    }
  }

  return results;
};

/** Extract permission rules from YAML spec blocks. */
const extractPermissionRulesFromYaml = (
  content: string,
): Array<{ actor: string; resource: string; actions: string[] }> => {
  const results: Array<{
    actor: string;
    resource: string;
    actions: string[];
  }> = [];
  const yamlMatches = content.matchAll(YAML_CODE_BLOCK_REGEX);

  for (const match of yamlMatches) {
    const yamlContent = match[1] ?? "";
    try {
      const parsed = YAML.parse(yamlContent);
      if (
        !parsed ||
        typeof parsed !== "object" ||
        !Array.isArray(parsed.permissions)
      )
        continue;

      for (const perm of parsed.permissions) {
        if (
          !perm ||
          typeof perm.actor !== "string" ||
          typeof perm.resource !== "string" ||
          !Array.isArray(perm.actions)
        )
          continue;
        results.push({
          actor: perm.actor,
          resource: perm.resource,
          actions: perm.actions.map(String),
        });
      }
    } catch {
      // skip parse errors
    }
  }

  return results;
};
