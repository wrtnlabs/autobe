import {
  AutoBeAnalyzeFileScenario,
  AutoBeAnalyzeWriteSectionEvent,
} from "@autobe/interface";
import YAML from "yaml";

// ─── YAML-based Error Code Canonical Registry ───

/**
 * A single canonical error code entry extracted from a YAML spec block in
 * 04-business-rules.
 */
export interface IErrorCodeRegistryEntry {
  /** Error code, e.g. "TODO_NOT_FOUND" */
  code: string;
  /** HTTP status code, e.g. 404 */
  http: number;
  /** Condition description */
  condition: string;
}

/**
 * A reference to an error code found via backtick pattern in non-canonical
 * files.
 */
export interface IErrorCodeReference {
  code: string;
  fileIndex: number;
  sectionTitle: string;
}

/** Result of comparing canonical error code definitions to backtick references. */
export interface IErrorCodeValidationResult {
  /** All canonical error codes from 04-business-rules YAML blocks */
  canonical: IErrorCodeRegistryEntry[];
  /** All backtick error code references in other files */
  references: IErrorCodeReference[];
  /** References that don't match any canonical definition */
  undefinedReferences: IErrorCodeReference[];
  /** YAML parse errors */
  parseErrors: Array<{
    fileIndex: number;
    sectionTitle: string;
    error: string;
  }>;
}

export interface IErrorCodeConflict {
  /** Normalized condition key */
  conditionKey: string;
  /** Different error codes for the same condition */
  codes: Array<{
    errorCode: string;
    httpStatus: number;
    files: string[];
  }>;
}

// ─── YAML Block Extraction ───

const YAML_CODE_BLOCK_REGEX = /```yaml\n([\s\S]*?)```/g;

/**
 * Extract canonical error codes from 04-business-rules YAML spec blocks.
 *
 * Expects YAML blocks with structure:
 *
 * ```yaml
 * errors:
 *   - code: TODO_NOT_FOUND
 *     http: 404
 *     condition: "requested todo does not exist"
 * ```
 */
const extractCanonicalErrorCodes = (
  fileIndex: number,
  sectionEvents: AutoBeAnalyzeWriteSectionEvent[][],
): {
  entries: IErrorCodeRegistryEntry[];
  errors: Array<{ fileIndex: number; sectionTitle: string; error: string }>;
} => {
  const entries: IErrorCodeRegistryEntry[] = [];
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
              Array.isArray(parsed.errors)
            ) {
              for (const err of parsed.errors) {
                if (err && typeof err.code === "string") {
                  entries.push({
                    code: err.code,
                    http: typeof err.http === "number" ? err.http : 400,
                    condition: String(err.condition ?? ""),
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

/** Match backtick `UPPER_SNAKE_CASE` patterns (error codes) */
const BACKTICK_ERROR_CODE_REGEX = /`([A-Z][A-Z0-9_]+)`/g;

/** Extract backtick `ERROR_CODE` references from section content. */
const extractBacktickErrorCodeReferences = (
  fileIndex: number,
  sectionEvents: AutoBeAnalyzeWriteSectionEvent[][],
): IErrorCodeReference[] => {
  const refs: IErrorCodeReference[] = [];

  for (const sectionsForModule of sectionEvents) {
    for (const sectionEvent of sectionsForModule) {
      for (const section of sectionEvent.sectionSections) {
        const matches = section.content.matchAll(BACKTICK_ERROR_CODE_REGEX);
        for (const match of matches) {
          // Skip common non-error-code patterns (HTTP methods, etc.)
          const code = match[1]!;
          if (
            code === "GET" ||
            code === "POST" ||
            code === "PUT" ||
            code === "PATCH" ||
            code === "DELETE" ||
            code === "HEAD" ||
            code === "OPTIONS"
          )
            continue;
          refs.push({
            code,
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
 * Validate error code references across files using YAML canonical definitions.
 *
 * 1. Extracts canonical error codes from 04-business-rules YAML blocks
 * 2. Extracts backtick `ERROR_CODE` references from 03-functional-requirements
 * 3. Reports undefined references
 */
export const validateErrorCodes = (props: {
  files: Array<{
    file: AutoBeAnalyzeFileScenario;
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
  }>;
}): IErrorCodeValidationResult => {
  let canonical: IErrorCodeRegistryEntry[] = [];
  const parseErrors: IErrorCodeValidationResult["parseErrors"] = [];

  // Extract canonical from 04-business-rules
  const businessRulesIndex = props.files.findIndex(
    (f) => f.file.filename === "04-business-rules.md",
  );

  if (businessRulesIndex >= 0) {
    const result = extractCanonicalErrorCodes(
      businessRulesIndex,
      props.files[businessRulesIndex]!.sectionEvents,
    );
    canonical = result.entries;
    parseErrors.push(...result.errors);
  }

  // Build canonical lookup set
  const canonicalSet = new Set(canonical.map((e) => e.code));

  // Extract references from 03-functional-requirements
  const references: IErrorCodeReference[] = [];
  for (let i = 0; i < props.files.length; i++) {
    const filename = props.files[i]!.file.filename;
    if (filename === "03-functional-requirements.md") {
      references.push(
        ...extractBacktickErrorCodeReferences(i, props.files[i]!.sectionEvents),
      );
    }
  }

  const undefinedReferences = references.filter(
    (ref) => !canonicalSet.has(ref.code),
  );

  return { canonical, references, undefinedReferences, parseErrors };
};

// ─── Legacy exports (kept for backward compatibility) ───

/**
 * Detect error code conflicts across files.
 *
 * Now operates on YAML-extracted data. A conflict occurs when the same error
 * code appears with different HTTP statuses across YAML blocks.
 */
export const detectErrorCodeConflicts = (props: {
  files: Array<{
    file: AutoBeAnalyzeFileScenario;
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
  }>;
}): IErrorCodeConflict[] => {
  // code → { http → Set<filename> }
  const codeMap: Map<string, Map<number, Set<string>>> = new Map();

  for (const { file, sectionEvents } of props.files) {
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
                Array.isArray(parsed.errors)
              ) {
                for (const err of parsed.errors) {
                  if (!err || typeof err.code !== "string") continue;
                  const code = err.code;
                  const http = typeof err.http === "number" ? err.http : 400;
                  if (!codeMap.has(code)) codeMap.set(code, new Map());
                  const httpMap = codeMap.get(code)!;
                  if (!httpMap.has(http)) httpMap.set(http, new Set());
                  httpMap.get(http)!.add(file.filename);
                }
              }
            } catch {
              // skip parse errors
            }
          }
        }
      }
    }
  }

  return [...codeMap.entries()]
    .filter(([, httpMap]) => httpMap.size > 1)
    .map(([code, httpMap]) => ({
      conditionKey: code,
      codes: [...httpMap.entries()].map(([http, files]) => ({
        errorCode: code,
        httpStatus: http,
        files: [...files],
      })),
    }));
};

/** Build a map from filename → list of error code conflict feedback strings. */
export const buildFileErrorCodeConflictMap = (
  conflicts: IErrorCodeConflict[],
): Map<string, string[]> => {
  const map: Map<string, string[]> = new Map();

  for (const conflict of conflicts) {
    const allFiles = new Set(conflict.codes.flatMap((c) => c.files));
    const feedback =
      `Error code conflict for "${conflict.conditionKey}": ` +
      conflict.codes
        .map((c) => `HTTP ${c.httpStatus} in [${c.files.join(", ")}]`)
        .join(" vs ") +
      `. Use ONE canonical HTTP status.`;

    for (const filename of allFiles) {
      if (!map.has(filename)) map.set(filename, []);
      map.get(filename)!.push(feedback);
    }
  }

  return map;
};

/** @deprecated Bridge block registry removed. Use validateErrorCodes() instead. */
export const buildErrorCodeRegistry = (props: {
  files: Array<{
    file: AutoBeAnalyzeFileScenario;
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
  }>;
}): IErrorCodeRegistryEntry[] => {
  const result = validateErrorCodes(props);
  return result.canonical;
};

/** @deprecated Bridge block injection removed. */
export const formatErrorCodeRegistryForPrompt = (
  _registry: IErrorCodeRegistryEntry[],
): string => {
  return "";
};
