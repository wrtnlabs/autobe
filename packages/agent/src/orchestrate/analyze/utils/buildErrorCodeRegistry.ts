import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeWriteSectionEvent,
} from "@autobe/interface";

// ─── Error Code Canonical Registry ───

/**
 * A single entry in the Error Code Canonical Registry.
 *
 * Tracks the first full specification of a condition→error code mapping,
 * enabling downstream section writes to reference rather than reinvent.
 */
export interface IErrorCodeRegistryEntry {
  /** Normalized condition key, e.g. "empty_title" */
  conditionKey: string;
  /** Original condition text, e.g. "empty title" */
  condition: string;
  /** HTTP status code, e.g. 400 */
  httpStatus: number;
  /** Error code, e.g. "TODO_TITLE_REQUIRED" */
  errorCode: string;
  /** Which file defined it */
  definedInFile: string;
  /** Which section defined it */
  definedInSection: string;
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

const DOWNSTREAM_CONTEXT_REGEX =
  /\*\*\[DOWNSTREAM CONTEXT\]\*\*([\s\S]*?)\n---/g;

// Match patterns like: "HTTP 400, TODO_TITLE_REQUIRED" or "HTTP 400 TODO_TITLE_REQUIRED"
// or just "TODO_TITLE_REQUIRED"
const ERROR_CODE_PATTERN = /([A-Z][A-Z0-9_]{2,})/;
const HTTP_STATUS_PATTERN = /HTTP\s*(\d{3})/i;

/**
 * Normalize a condition string into a comparable key.
 *
 * Examples:
 *
 * - "empty title" → "empty_title"
 * - "title is missing" → "title_is_missing"
 * - "title missing" → "title_missing"
 */
const normalizeConditionKey = (condition: string): string =>
  condition
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

/**
 * Extract error scenarios from Bridge Block content.
 *
 * Parses `**Error Scenarios**` entries in format: `- condition → HTTP status,
 * ERROR_CODE`
 */
const extractErrorScenarios = (
  content: string,
): Array<{
  conditionKey: string;
  condition: string;
  httpStatus: number;
  errorCode: string;
}> => {
  const results: Array<{
    conditionKey: string;
    condition: string;
    httpStatus: number;
    errorCode: string;
  }> = [];
  const matches = content.matchAll(DOWNSTREAM_CONTEXT_REGEX);

  for (const match of matches) {
    const block = match[1] ?? "";
    const lines = block.split("\n");
    let inErrors = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.startsWith("**Error Scenarios**")) {
        inErrors = true;
        continue;
      }
      if (line.startsWith("**") && !line.startsWith("**Error Scenarios**")) {
        inErrors = false;
        continue;
      }
      if (!inErrors || !line.startsWith("-")) continue;

      const body = line.replace(/^-+\s*/, "");
      // Split by arrow (→ or ->)
      const arrowIndex = body.search(/\s*(?:→|->)\s*/);
      if (arrowIndex < 0) continue;

      const condition = body.slice(0, arrowIndex).trim();
      const response = body
        .slice(arrowIndex)
        .replace(/^\s*(?:→|->)\s*/, "")
        .trim();

      if (!condition || !response) continue;

      // Extract error code
      const codeMatch = response.match(ERROR_CODE_PATTERN);
      if (!codeMatch) continue;

      const errorCode = codeMatch[1]!;

      // Extract HTTP status (default to 400 if not found)
      const statusMatch = response.match(HTTP_STATUS_PATTERN);
      const httpStatus = statusMatch ? parseInt(statusMatch[1]!, 10) : 400;

      const conditionKey = normalizeConditionKey(condition);
      if (!conditionKey) continue;

      results.push({ conditionKey, condition, httpStatus, errorCode });
    }
  }

  return results;
};

/**
 * Build an Error Code Canonical Registry from completed file states.
 *
 * Scans all DOWNSTREAM CONTEXT Bridge Blocks across completed files and
 * extracts the first error code definition for each condition. The registry
 * follows "first writer wins".
 */
export const buildErrorCodeRegistry = (props: {
  files: Array<{
    file: AutoBeAnalyzeFile.Scenario;
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
  }>;
}): IErrorCodeRegistryEntry[] => {
  const registry: Map<string, IErrorCodeRegistryEntry> = new Map();

  for (const { file, sectionEvents } of props.files) {
    for (const sectionsForModule of sectionEvents) {
      for (const sectionEvent of sectionsForModule) {
        for (const section of sectionEvent.sectionSections) {
          const scenarios = extractErrorScenarios(section.content);
          for (const {
            conditionKey,
            condition,
            httpStatus,
            errorCode,
          } of scenarios) {
            if (!registry.has(conditionKey)) {
              registry.set(conditionKey, {
                conditionKey,
                condition,
                httpStatus,
                errorCode,
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
 * Detect error code conflicts across files.
 *
 * A conflict occurs when the same normalized condition has different error
 * codes across files (e.g., TODO_TITLE_REQUIRED vs TODOTITLE_MISSING).
 */
export const detectErrorCodeConflicts = (props: {
  files: Array<{
    file: AutoBeAnalyzeFile.Scenario;
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
  }>;
}): IErrorCodeConflict[] => {
  // conditionKey → errorCode → { httpStatus, files }
  const codeMap: Map<
    string,
    Map<string, { httpStatus: number; files: Set<string> }>
  > = new Map();

  for (const { file, sectionEvents } of props.files) {
    for (const sectionsForModule of sectionEvents) {
      for (const sectionEvent of sectionsForModule) {
        for (const section of sectionEvent.sectionSections) {
          const scenarios = extractErrorScenarios(section.content);
          for (const { conditionKey, httpStatus, errorCode } of scenarios) {
            if (!codeMap.has(conditionKey))
              codeMap.set(conditionKey, new Map());
            const codes = codeMap.get(conditionKey)!;
            if (!codes.has(errorCode))
              codes.set(errorCode, { httpStatus, files: new Set() });
            codes.get(errorCode)!.files.add(file.filename);
          }
        }
      }
    }
  }

  return [...codeMap.entries()]
    .filter(([, codes]) => codes.size > 1)
    .map(([conditionKey, codes]) => ({
      conditionKey,
      codes: [...codes.entries()].map(([errorCode, { httpStatus, files }]) => ({
        errorCode,
        httpStatus,
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
      `Error code conflict for condition "${conflict.conditionKey}": ` +
      conflict.codes
        .map(
          (c) =>
            `${c.errorCode} (HTTP ${c.httpStatus}) in [${c.files.join(", ")}]`,
        )
        .join(" vs ") +
      `. Use ONE canonical error code.`;

    for (const filename of allFiles) {
      if (!map.has(filename)) map.set(filename, []);
      map.get(filename)!.push(feedback);
    }
  }

  return map;
};

/** Format the error code registry as a prompt-injectable text block. */
export const formatErrorCodeRegistryForPrompt = (
  registry: IErrorCodeRegistryEntry[],
): string => {
  if (registry.length === 0) {
    return "";
  }

  const lines: string[] = [
    "## CANONICAL ERROR CODE REGISTRY (READ-ONLY — do NOT reinvent)",
    "",
    "The following error codes are already defined in other sections.",
    "Your Bridge Block MUST use the EXACT same error code for these conditions:",
    "",
  ];

  for (const entry of registry) {
    lines.push(
      `- ${entry.condition} → HTTP ${entry.httpStatus}, ${entry.errorCode} (defined in "${entry.definedInSection}" of ${entry.definedInFile})`,
    );
  }

  return lines.join("\n");
};
