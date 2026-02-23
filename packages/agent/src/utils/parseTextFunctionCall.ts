/**
 * Parses text-based function calls from LLM response content.
 *
 * Some models (e.g., Qwen3) attempt function calling but return the call as
 * plain text/JSON in `message.content` instead of the proper `tool_calls`
 * field. This utility extracts those text-based function calls and normalizes
 * them into a structured format.
 *
 * @author Juntak
 */

export interface IParsedFunctionCall {
  /** Function name (must match one of the available tools) */
  name: string;
  /** Arguments as a JSON string */
  arguments: string;
}

/**
 * Extracts function calls from text content.
 *
 * Parsing strategy (in priority order):
 * 1. XML `<tool_call>` tags (Qwen3's primary pattern)
 * 2. Markdown code blocks
 * 3. Raw JSON objects in content
 *
 * Only returns calls whose function name matches `availableToolNames`.
 *
 * @param content The text content to parse
 * @param availableToolNames List of valid function names from the request tools
 * @returns Array of parsed function calls (empty if none found)
 */
export const parseTextFunctionCall = (
  content: string,
  availableToolNames: string[],
): IParsedFunctionCall[] => {
  if (!content || !availableToolNames.length) return [];

  const toolNameSet = new Set(availableToolNames);
  let results: IParsedFunctionCall[] = [];

  // Strategy 1: XML <tool_call> tags
  results = parseXmlToolCalls(content, toolNameSet);
  if (results.length > 0) return results;

  // Strategy 2: Markdown code blocks
  results = parseMarkdownCodeBlocks(content, toolNameSet);
  if (results.length > 0) return results;

  // Strategy 3: Raw JSON objects/arrays
  results = parseRawJson(content, toolNameSet);
  return results;
};

// ──────────────────────────────────────────────
// Strategy 1: XML <tool_call> tags
// ──────────────────────────────────────────────

const XML_TOOL_CALL_RE = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/g;

const parseXmlToolCalls = (
  content: string,
  toolNames: Set<string>,
): IParsedFunctionCall[] => {
  const results: IParsedFunctionCall[] = [];
  let match: RegExpExecArray | null;

  while ((match = XML_TOOL_CALL_RE.exec(content)) !== null) {
    const parsed = tryParseCandidate(match[1]!, toolNames);
    if (parsed) results.push(parsed);
  }
  XML_TOOL_CALL_RE.lastIndex = 0;

  return results;
};


const MARKDOWN_CODE_BLOCK_RE = /```(?:json)?\s*\n([\s\S]*?)\n\s*```/g;

const parseMarkdownCodeBlocks = (
  content: string,
  toolNames: Set<string>,
): IParsedFunctionCall[] => {
  const results: IParsedFunctionCall[] = [];
  let match: RegExpExecArray | null;

  while ((match = MARKDOWN_CODE_BLOCK_RE.exec(content)) !== null) {
    const blockContent = match[1]!.trim();

    // Try as array of calls
    const arrayCalls = tryParseArray(blockContent, toolNames);
    if (arrayCalls.length > 0) {
      results.push(...arrayCalls);
      continue;
    }

    // Try as single call
    const parsed = tryParseCandidate(blockContent, toolNames);
    if (parsed) results.push(parsed);
  }
  MARKDOWN_CODE_BLOCK_RE.lastIndex = 0;

  return results;
};

const parseRawJson = (
  content: string,
  toolNames: Set<string>,
): IParsedFunctionCall[] => {
  const trimmed = content.trim();

  // Try as JSON array first
  if (trimmed.startsWith("[")) {
    const arrayCalls = tryParseArray(trimmed, toolNames);
    if (arrayCalls.length > 0) return arrayCalls;
  }

  // Extract individual JSON objects via brace-matching
  const jsonCandidates = extractJsonObjects(trimmed);
  const results: IParsedFunctionCall[] = [];

  for (const candidate of jsonCandidates) {
    const parsed = tryParseCandidate(candidate, toolNames);
    if (parsed) results.push(parsed);
  }

  return results;
};

/**
 * Attempts to parse a JSON string as a function call candidate.
 * Handles field name normalization and OpenAI-style nesting.
 */
const tryParseCandidate = (
  text: string,
  toolNames: Set<string>,
): IParsedFunctionCall | null => {
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(text.trim());
  } catch {
    return null;
  }

  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return null;

  return normalizeToFunctionCall(obj, toolNames);
};

/**
 * Tries to parse a JSON array of function call candidates.
 */
const tryParseArray = (
  text: string,
  toolNames: Set<string>,
): IParsedFunctionCall[] => {
  let arr: unknown[];
  try {
    arr = JSON.parse(text.trim());
  } catch {
    return [];
  }

  if (!Array.isArray(arr)) return [];

  const results: IParsedFunctionCall[] = [];
  for (const item of arr) {
    if (typeof item === "object" && item !== null && !Array.isArray(item)) {
      const parsed = normalizeToFunctionCall(
        item as Record<string, unknown>,
        toolNames,
      );
      if (parsed) results.push(parsed);
    }
  }
  return results;
};

/**
 * Normalizes a parsed JSON object into a function call.
 *
 * Handles:
 * - Direct fields: { name: "fn", arguments: {...} }
 * - OpenAI nesting: { function: { name: "fn", arguments: {...} } }
 * - Various field names: name/function/function_name/tool_name,
 *   arguments/parameters/params/input
 */
const normalizeToFunctionCall = (
  obj: Record<string, unknown>,
  toolNames: Set<string>,
): IParsedFunctionCall | null => {
  // Unwrap OpenAI-style nesting: { function: { name, arguments } }
  if (
    typeof obj.function === "object" &&
    obj.function !== null &&
    !Array.isArray(obj.function)
  ) {
    const inner = obj.function as Record<string, unknown>;
    if (typeof inner.name === "string") {
      obj = { ...inner };
    }
  }

  // Extract function name
  const name = extractString(obj, NAME_KEYS);
  if (!name || !toolNames.has(name)) return null;

  // Extract arguments
  const args = extractArguments(obj);

  return { name, arguments: args };
};

const NAME_KEYS = ["name", "function", "function_name", "tool_name"] as const;
const ARGS_KEYS = [
  "arguments",
  "parameters",
  "params",
  "input",
] as const;

const extractString = (
  obj: Record<string, unknown>,
  keys: readonly string[],
): string | null => {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "string" && val.length > 0) return val;
  }
  return null;
};

const extractArguments = (obj: Record<string, unknown>): string => {
  for (const key of ARGS_KEYS) {
    const val = obj[key];
    if (val === undefined || val === null) continue;

    // Already a JSON string
    if (typeof val === "string") {
      // Check if it's a stringified JSON — if so, keep as-is
      try {
        JSON.parse(val);
        return val;
      } catch {
        // Not valid JSON string, wrap it
        return JSON.stringify(val);
      }
    }

    // Object or array — stringify it
    if (typeof val === "object") {
      return JSON.stringify(val);
    }
  }

  return "{}";
};

/**
 * Extracts complete JSON objects from text using brace-matching.
 * Handles strings containing braces by tracking quote state.
 */
const extractJsonObjects = (text: string): string[] => {
  const results: string[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === "\\") {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        results.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }

  return results;
};
