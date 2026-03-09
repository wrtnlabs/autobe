/**
 * Shared low-level repair utilities used by multiple analyze-phase
 * orchestrators.
 *
 * These helpers are intentionally free of orchestrator-specific knowledge: they
 * only deal with raw JSON/string normalization.
 */

/**
 * Parse a string that might be a JSON array or object emitted by models that
 * sometimes return a stringified payload instead of a real JS value. Also
 * handles Qwen / Python pseudo-JSON (single quotes, None, True, False).
 *
 * Returns `undefined` when the string cannot be parsed, so callers can
 * distinguish "got nothing useful" from "got null".
 */
export const parseLooseStructuredString = (input: string): unknown => {
  const text: string = input.trim();
  if (text.length === 0) return undefined;
  if (
    (text.startsWith("[") === false && text.startsWith("{") === false) ||
    (text.endsWith("]") === false && text.endsWith("}") === false)
  )
    return undefined;

  try {
    return JSON.parse(text);
  } catch {
    // qwen sometimes emits pseudo-JSON with single quotes
    const normalized = text
      .replace(/'/g, '"')
      .replace(/\bNone\b/g, "null")
      .replace(/\bTrue\b/g, "true")
      .replace(/\bFalse\b/g, "false");
    try {
      return JSON.parse(normalized);
    } catch {
      return undefined;
    }
  }
};

/**
 * Type-guard: returns true when `input` is a plain object (not array, not
 * null).
 */
export const isRecord = (input: unknown): input is Record<string, unknown> =>
  typeof input === "object" && input !== null && Array.isArray(input) === false;

/**
 * If `value` is a JSON string that parses into a plain object, return the
 * parsed object. Otherwise return `value` unchanged. This covers the case where
 * an LLM (e.g. Qwen) serializes the entire `request` payload as a string
 * instead of emitting a nested object.
 */
export const tryParseStringAsRecord = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  const parsed = parseLooseStructuredString(value);
  return isRecord(parsed) ? parsed : value;
};
