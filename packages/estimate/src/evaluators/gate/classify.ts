// Shared severity classification for TS diagnostic codes.
// Syntax-breaking errors are critical, type mismatches are warnings, the rest are suggestions.

const CRITICAL_CODES = new Set([
  1002, 1003, 1005, 1009, 1054, 1109, 1128, 1136, 1141, 1160, 1161,
]);

const WARNING_CODES = new Set([
  // Cannot find name/module (import resolution)
  2304, 2305, 2306, 2307,
  // Type mismatch / assignment errors
  2314, 2322, 2339, 2345, 2352,
  // Spelling suggestions, argument count, readonly
  2551, 2554, 2540, 2561,
  // Property missing, no overload match, not assignable in extends
  2741, 2769, 2416,
  // Cannot be used as index, function must return
  2538, 2355,
  // Implicit any
  7006, 7031, 7053,
  // Strict null checks (variable is possibly null/undefined/unknown)
  18046, 18047, 18048,
]);

// Infrastructure noise — does not affect gate or penalties
// TS6054: "File has unsupported extension" (.prisma files in tsconfig)
const INFRASTRUCTURE_CODES = new Set([6054]);

export function classifyDiagnostic(
  code: number,
): "critical" | "warning" | "suggestion" {
  if (CRITICAL_CODES.has(code)) return "critical";
  if (INFRASTRUCTURE_CODES.has(code)) return "suggestion";
  if (WARNING_CODES.has(code)) return "warning";
  return "suggestion";
}
