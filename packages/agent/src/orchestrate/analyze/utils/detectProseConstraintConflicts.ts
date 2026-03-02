import {
  AutoBeAnalyzeFile,
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
  file: AutoBeAnalyzeFile.Scenario;
  sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
}>;

// ─── Constants ───

const YAML_CODE_BLOCK_REGEX = /```yaml\n[\s\S]*?```/g;
const CANONICAL_FILENAME = "02-domain-model.md";

/**
 * Regex to find backtick-wrapped Entity.attribute references.
 * Matches patterns like `User.bio`, `Article.title`, `Comment.content`.
 */
const BACKTICK_REF_REGEX = /`([A-Z][a-zA-Z]*\.[a-zA-Z]+)`/g;

/**
 * Numeric constraint patterns found near backtick references in prose.
 * Matches: "300 characters", "1-50 characters", "1–150 characters",
 * "up to 2000 characters", "maximum 500 chars", "minimum 8 characters",
 * "exceeds 300 characters", "at least 1 character", "at most 200 characters".
 */
const NUMERIC_PATTERNS: RegExp[] = [
  // Range: "1-50 characters", "1–150 characters", "0–300 characters"
  /(\d+)\s*[–\-]\s*(\d+)\s*(?:characters|chars?|unicode characters)/gi,
  // Single number with unit: "300 characters", "2000 characters"
  /(?:up to|maximum|max|at most|no more than|exceeds?|at least|minimum|min|no less than)\s+(\d+)\s*(?:characters|chars?|unicode characters)/gi,
  // Plain: "N characters" (when preceded by constraint-like context)
  /(?:limited to|restricted to|capped at|allow(?:s|ed)?)\s+(\d+)\s*(?:characters|chars?|unicode characters)/gi,
];

// ─── Canonical Registry ───

/**
 * Build a map of Entity.attribute → canonical numeric values from 02-domain-model YAML blocks.
 */
function buildCanonicalNumericRegistry(
  canonicalFile: FileSectionInput[number],
): Map<string, number[]> {
  const registry: Map<string, number[]> = new Map();

  for (const sectionsForModule of canonicalFile.sectionEvents) {
    for (const sectionEvent of sectionsForModule) {
      for (const section of sectionEvent.sectionSections) {
        const yamlMatches = section.content.matchAll(
          /```yaml\n([\s\S]*?)```/g,
        );
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
 * Extract all integer numbers from a constraint string.
 * "1-50, required" → [1, 50]
 * "optional, maximum 2000 characters, may be null" → [2000]
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

// ─── Prose Constraint Extraction ───

interface IProseMention {
  entityAttr: string;
  numbers: number[];
  context: string;
}

/**
 * Extract constraint mentions from prose text (YAML blocks already stripped).
 *
 * Finds backtick references like `User.bio` and looks for numeric constraint
 * patterns within proximity (same line or nearby lines).
 */
function extractProseConstraintMentions(proseContent: string): IProseMention[] {
  const results: IProseMention[] = [];
  const lines = proseContent.split("\n");

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx]!;
    const refMatches = [...line.matchAll(BACKTICK_REF_REGEX)];
    if (refMatches.length === 0) continue;

    // Build a context window: current line + 2 lines after
    const contextLines = lines
      .slice(lineIdx, Math.min(lineIdx + 3, lines.length))
      .join("\n");

    for (const refMatch of refMatches) {
      const entityAttr = refMatch[1]!;
      const numbers = extractConstraintNumbers(contextLines);
      if (numbers.length === 0) continue;
      results.push({
        entityAttr,
        numbers,
        context: line.trim().slice(0, 200),
      });
    }
  }

  // Deduplicate: same entityAttr + same numbers from multiple lines → keep first
  const seen: Map<string, IProseMention> = new Map();
  for (const mention of results) {
    const key = `${mention.entityAttr}:${mention.numbers.sort((a, b) => a - b).join(",")}`;
    if (!seen.has(key)) seen.set(key, mention);
  }

  return [...seen.values()];
}

/**
 * Extract numbers from constraint-like patterns in text.
 * Only extracts numbers that appear in constraint context (near "characters", etc.).
 */
function extractConstraintNumbers(text: string): number[] {
  const numbers: Set<number> = new Set();

  for (const pattern of NUMERIC_PATTERNS) {
    // Reset lastIndex for global regexes
    pattern.lastIndex = 0;
    const matches = text.matchAll(pattern);
    for (const m of matches) {
      // Group 1 is always present, group 2 exists for range patterns
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
 * Detect prose-level constraint value conflicts between non-canonical files
 * and the canonical 02-domain-model.
 *
 * Scans prose text (outside YAML blocks) in non-canonical files for
 * backtick Entity.attribute references with numeric values that differ
 * from the canonical YAML definition.
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

          const mentions = extractProseConstraintMentions(proseContent);

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
 * Build a map from filename → list of prose conflict feedback strings.
 * Only non-canonical files appear in the map.
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
