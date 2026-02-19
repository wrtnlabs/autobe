// Shared severity classification for TS diagnostic codes.
// Syntax-breaking errors are critical, type mismatches are warnings, the rest are suggestions.

const CRITICAL_CODES = new Set([
  1002, 1003, 1005, 1009, 1054, 1109, 1128, 1136, 1141, 1160, 1161,
]);

const WARNING_CODES = new Set([
  2304, 2305, 2306, 2307, 2314, 2322, 2345, 2551, 2554, 2561, 6054, 7006, 7031,
]);

export function classifyDiagnostic(
  code: number,
): "critical" | "warning" | "suggestion" {
  if (CRITICAL_CODES.has(code)) return "critical";
  if (WARNING_CODES.has(code)) return "warning";
  return "suggestion";
}
