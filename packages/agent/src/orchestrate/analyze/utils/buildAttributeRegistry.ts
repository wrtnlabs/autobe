import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeWriteSectionEvent,
} from "@autobe/interface";
import YAML from "yaml";

// ─── YAML-based Attribute Canonical Registry ───

/**
 * A single canonical attribute entry extracted from a YAML spec block in
 * 02-domain-model.
 */
export interface IAttributeRegistryEntry {
  /** Entity name, e.g. "Todo" */
  entity: string;
  /** Attribute name, e.g. "title" */
  attribute: string;
  /** Type, e.g. "text" */
  type: string;
  /** Constraints, e.g. "1-500, required" */
  constraints: string;
}

/**
 * A reference to an Entity.field found via backtick pattern in non-canonical
 * files (03/04/05).
 */
export interface IAttributeReference {
  entity: string;
  field: string;
  fileIndex: number;
  sectionTitle: string;
}

/**
 * Result of comparing canonical attribute definitions to backtick references.
 */
export interface IAttributeValidationResult {
  /** All canonical attributes extracted from 02-domain-model YAML blocks */
  canonical: IAttributeRegistryEntry[];
  /** All backtick references found in non-canonical files */
  references: IAttributeReference[];
  /** References that don't match any canonical definition */
  undefinedReferences: IAttributeReference[];
  /** YAML parse errors encountered */
  parseErrors: Array<{ fileIndex: number; sectionTitle: string; error: string }>;
}

// ─── YAML Block Extraction ───

const YAML_CODE_BLOCK_REGEX = /```yaml\n([\s\S]*?)```/g;

/**
 * Extract canonical attribute entries from 02-domain-model YAML spec blocks.
 *
 * Expects YAML blocks with structure:
 * ```yaml
 * entity: Todo
 * attributes:
 *   - name: title
 *     type: text
 *     constraints: "1-500, required"
 * ```
 */
const extractCanonicalAttributes = (
  fileIndex: number,
  sectionEvents: AutoBeAnalyzeWriteSectionEvent[][],
): {
  entries: IAttributeRegistryEntry[];
  errors: Array<{ fileIndex: number; sectionTitle: string; error: string }>;
} => {
  const entries: IAttributeRegistryEntry[] = [];
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
              typeof parsed.entity === "string" &&
              Array.isArray(parsed.attributes)
            ) {
              for (const attr of parsed.attributes) {
                if (attr && typeof attr.name === "string") {
                  entries.push({
                    entity: parsed.entity,
                    attribute: attr.name,
                    type: String(attr.type ?? ""),
                    constraints: String(attr.constraints ?? ""),
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

/** Match backtick `Entity.field` patterns (PascalCase entity, camelCase field) */
const BACKTICK_ENTITY_FIELD_REGEX = /`(\w+)\.(\w+)`/g;

/**
 * Extract backtick `Entity.field` references from section content.
 */
const extractBacktickReferences = (
  fileIndex: number,
  sectionEvents: AutoBeAnalyzeWriteSectionEvent[][],
): IAttributeReference[] => {
  const refs: IAttributeReference[] = [];

  for (const sectionsForModule of sectionEvents) {
    for (const sectionEvent of sectionsForModule) {
      for (const section of sectionEvent.sectionSections) {
        const matches = section.content.matchAll(BACKTICK_ENTITY_FIELD_REGEX);
        for (const match of matches) {
          refs.push({
            entity: match[1]!,
            field: match[2]!,
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
 * Validate attribute references across files using YAML canonical definitions.
 *
 * 1. Extracts canonical attributes from 02-domain-model YAML spec blocks
 * 2. Extracts backtick `Entity.field` references from other files
 * 3. Compares references against canonical definitions
 * 4. Reports undefined references (referenced but not in canonical)
 */
export const validateAttributes = (props: {
  files: Array<{
    file: AutoBeAnalyzeFile.Scenario;
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
  }>;
}): IAttributeValidationResult => {
  // Step 1: Extract canonical attributes from 02-domain-model
  let canonical: IAttributeRegistryEntry[] = [];
  const parseErrors: IAttributeValidationResult["parseErrors"] = [];

  const domainModelIndex = props.files.findIndex(
    (f) => f.file.filename === "02-domain-model.md",
  );

  if (domainModelIndex >= 0) {
    const result = extractCanonicalAttributes(
      domainModelIndex,
      props.files[domainModelIndex]!.sectionEvents,
    );
    canonical = result.entries;
    parseErrors.push(...result.errors);
  }

  // Step 2: Build canonical lookup set
  const canonicalSet = new Set(
    canonical.map((e) => `${e.entity}.${e.attribute}`),
  );

  // Step 3: Extract backtick references from non-canonical files (03/04/05)
  const references: IAttributeReference[] = [];
  for (let i = 0; i < props.files.length; i++) {
    const filename = props.files[i]!.file.filename;
    // Skip canonical files for entity definitions (00/01/02)
    if (
      filename === "00-toc.md" ||
      filename === "01-actors-and-auth.md" ||
      filename === "02-domain-model.md"
    )
      continue;
    references.push(
      ...extractBacktickReferences(i, props.files[i]!.sectionEvents),
    );
  }

  // Step 4: Find undefined references
  const undefinedReferences = references.filter(
    (ref) => !canonicalSet.has(`${ref.entity}.${ref.field}`),
  );

  return { canonical, references, undefinedReferences, parseErrors };
};

// ─── Legacy exports (kept for backward compatibility, will be no-ops) ───

/** @deprecated Bridge block parsing removed. Use validateAttributes() instead. */
export const buildAttributeRegistry = (props: {
  files: Array<{
    file: AutoBeAnalyzeFile.Scenario;
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
  }>;
}): IAttributeRegistryEntry[] => {
  const result = validateAttributes(props);
  return result.canonical;
};

/** @deprecated Bridge block injection removed. */
export const formatRegistryForPrompt = (
  _registry: IAttributeRegistryEntry[],
): string => {
  return "";
};
