import {
  AutoBeAnalyze,
  AutoBeAnalyzeWriteSectionEvent,
} from "@autobe/interface";
import YAML from "yaml";

// ─── Types ───

export interface IProseConstraintConflict {
  entityAttr: string;
  canonicalValues: number[];
  proseValues: number[];
  file: string;
  sectionTitle: string;
  context: string;
}

type FileSectionInput = Array<{
  file: AutoBeAnalyze.IFileScenario;
  sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
}>;

// ─── Constants ───

const YAML_CODE_BLOCK_REGEX = /```yaml\n[\s\S]*?```/g;
const CANONICAL_FILENAME = "02-domain-model.md";

/**
 * Numeric constraint patterns found in prose text. Matches: "300 characters",
 * "1-50 characters", "1–150 characters", "up to 2000 characters", "maximum 500
 * chars", "minimum 8 characters", "exceeds 300 characters", "at least 1
 * character", "at most 200 characters".
 */
const NUMERIC_PATTERNS: RegExp[] = [
  // Range: "1-50 characters", "1–150 characters", "0–300 characters"
  /(\d+)\s*[–\-]\s*(\d+)\s*(?:characters|chars?|unicode characters)/gi,
  // Single number with unit: "300 characters", "2000 characters"
  /(?:up to|maximum|max|at most|no more than|exceeds?|at least|minimum|min|no less than)\s+(\d+)\s*(?:characters|chars?|unicode characters)/gi,
  // Plain: "N characters" (when preceded by constraint-like context)
  /(?:limited to|restricted to|capped at|allow(?:s|ed)?)\s+(\d+)\s*(?:characters|chars?|unicode characters)/gi,
];

// ─── Helpers ───

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Canonical Registry ───

/**
 * Build a map of Entity.attribute → canonical numeric values from
 * 02-domain-model YAML blocks.
 */
function buildCanonicalNumericRegistry(
  canonicalFile: FileSectionInput[number],
): Map<string, number[]> {
  const registry: Map<string, number[]> = new Map();

  for (const sectionsForModule of canonicalFile.sectionEvents) {
    for (const sectionEvent of sectionsForModule) {
      for (const section of sectionEvent.sectionSections) {
        const yamlMatches = section.content.matchAll(/```yaml\n([\s\S]*?)```/g);
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
              const constraintStr = String(attr.constraints ?? "");
              const numbers = extractAllNumbers(constraintStr);
              if (numbers.length === 0) continue;
              const key = `${parsed.entity}.${attr.name}`;
              registry.set(key, numbers);
            }
          } catch {
            // skip parse errors
          }
        }
      }
    }
  }

  return registry;
}

/**
 * Build a reverse index: attribute name → list of Entity.attribute keys. e.g.,
 * "bio" → ["User.bio"], "title" → ["Article.title", "Todo.title"]
 */
function buildAttributeNameIndex(
  registry: Map<string, number[]>,
): Map<string, string[]> {
  const index: Map<string, string[]> = new Map();
  for (const key of registry.keys()) {
    const dotIdx = key.indexOf(".");
    if (dotIdx < 0) continue;
    const attrName = key.slice(dotIdx + 1);
    if (!index.has(attrName)) index.set(attrName, []);
    index.get(attrName)!.push(key);
  }
  return index;
}

/**
 * Extract all integer numbers from a constraint string. "1-50, required" → [1,
 * 50] "optional, maximum 2000 characters, may be null" → [2000]
 */
function extractAllNumbers(value: string): number[] {
  const nums: Set<number> = new Set();
  const matches = value.matchAll(/\d+/g);
  for (const m of matches) {
    const n = parseInt(m[0], 10);
    if (!isNaN(n)) nums.add(n);
  }
  return [...nums];
}

// ─── Prose Constraint Extraction (Value-Driven) ───

interface IProseMention {
  entityAttr: string;
  numbers: number[];
  context: string;
}

/**
 * Value-driven prose constraint extraction.
 *
 * Instead of finding backtick references first, this approach:
 *
 * 1. Finds lines with numeric constraint patterns ("N characters", etc.)
 * 2. Checks if any canonical attribute name appears on that line
 * 3. Compares the numbers against canonical values
 *
 * This catches all patterns regardless of backtick usage:
 *
 * - `User.bio`: 0-300 characters
 * - `bio` (0-500 chars)
 * - Bio text limited to 300 characters
 * - | bio | 0-300 chars |
 */
function extractProseConstraintMentions(
  proseContent: string,
  attrNameIndex: Map<string, string[]>,
  registry: Map<string, number[]>,
): IProseMention[] {
  const results: IProseMention[] = [];
  const lines = proseContent.split("\n");

  for (const line of lines) {
    // Step 1: Extract constraint-like numbers from this line
    const numbers = extractConstraintNumbers(line);
    if (numbers.length === 0) continue;

    // Step 2: Check if any canonical attribute name appears on this line
    for (const [attrName, entityAttrs] of attrNameIndex) {
      const attrPattern = new RegExp(`\\b${escapeRegExp(attrName)}\\b`, "i");
      if (!attrPattern.test(line)) continue;

      // Step 3: Union all canonical values for all possible Entity.attr matches
      const allCanonical: Set<number> = new Set();
      for (const ea of entityAttrs) {
        const vals = registry.get(ea);
        if (vals) for (const v of vals) allCanonical.add(v);
      }

      // Step 4: Find numbers that don't match any canonical value
      const conflicting = numbers.filter(
        (n) => !allCanonical.has(n) && n !== 0,
      );
      if (conflicting.length === 0) continue;

      results.push({
        entityAttr: entityAttrs[0]!,
        numbers,
        context: line.trim().slice(0, 200),
      });
    }
  }

  // Deduplicate: same entityAttr + same numbers → keep first
  const seen: Map<string, IProseMention> = new Map();
  for (const mention of results) {
    const key = `${mention.entityAttr}:${mention.numbers.sort((a, b) => a - b).join(",")}`;
    if (!seen.has(key)) seen.set(key, mention);
  }

  return [...seen.values()];
}

/**
 * Extract numbers from constraint-like patterns in text. Only extracts numbers
 * that appear in constraint context (near "characters", etc.).
 */
function extractConstraintNumbers(text: string): number[] {
  const numbers: Set<number> = new Set();

  for (const pattern of NUMERIC_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = text.matchAll(pattern);
    for (const m of matches) {
      if (m[1]) {
        const n = parseInt(m[1], 10);
        if (!isNaN(n)) numbers.add(n);
      }
      if (m[2]) {
        const n = parseInt(m[2], 10);
        if (!isNaN(n)) numbers.add(n);
      }
    }
  }

  return [...numbers];
}

// ─── Main Detection ───

/**
 * Detect prose-level constraint value conflicts between non-canonical files and
 * the canonical 02-domain-model.
 *
 * Uses a value-driven approach: builds a reverse index of canonical attribute
 * names, then scans prose text for those names near numeric constraint
 * patterns. Catches all patterns regardless of backtick usage.
 */
export const detectProseConstraintConflicts = (props: {
  files: FileSectionInput;
}): IProseConstraintConflict[] => {
  // Find canonical file (02-domain-model.md)
  const canonicalFile = props.files.find(
    (f) => f.file.filename === CANONICAL_FILENAME,
  );
  if (!canonicalFile) return [];

  const registry = buildCanonicalNumericRegistry(canonicalFile);
  if (registry.size === 0) return [];

  const attrNameIndex = buildAttributeNameIndex(registry);

  const conflicts: IProseConstraintConflict[] = [];

  for (const { file, sectionEvents } of props.files) {
    // Skip canonical file itself
    if (file.filename === CANONICAL_FILENAME) continue;

    for (const sectionsForModule of sectionEvents) {
      for (const sectionEvent of sectionsForModule) {
        for (const section of sectionEvent.sectionSections) {
          // Strip YAML code blocks — those are handled by existing validators
          const proseContent = section.content.replace(
            YAML_CODE_BLOCK_REGEX,
            "",
          );

          const mentions = extractProseConstraintMentions(
            proseContent,
            attrNameIndex,
            registry,
          );

          for (const mention of mentions) {
            const canonicalValues = registry.get(mention.entityAttr);
            if (!canonicalValues) continue;

            // Check if prose values conflict with canonical
            const conflictingValues = mention.numbers.filter(
              (n) => !canonicalValues.includes(n) && n !== 0,
            );

            if (conflictingValues.length === 0) continue;

            conflicts.push({
              entityAttr: mention.entityAttr,
              canonicalValues,
              proseValues: mention.numbers,
              file: file.filename,
              sectionTitle: section.title,
              context: mention.context,
            });
          }
        }
      }
    }
  }

  return conflicts;
};

/**
 * Build a map from filename → list of prose conflict feedback strings. Only
 * non-canonical files appear in the map.
 */
export const buildFileProseConflictMap = (
  conflicts: IProseConstraintConflict[],
): Map<string, string[]> => {
  const map: Map<string, string[]> = new Map();

  for (const conflict of conflicts) {
    const feedback =
      `Prose constraint conflict: ${conflict.entityAttr} — ` +
      `canonical values [${conflict.canonicalValues.join(", ")}] (from ${CANONICAL_FILENAME}) vs ` +
      `prose values [${conflict.proseValues.join(", ")}] in "${conflict.sectionTitle}". ` +
      `Remove the restated value and use a backtick reference to ${CANONICAL_FILENAME} instead.`;

    if (!map.has(conflict.file)) map.set(conflict.file, []);
    map.get(conflict.file)!.push(feedback);
  }

  return map;
};
