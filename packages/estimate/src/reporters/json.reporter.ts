import type { EvaluationResult } from "../types";

/** Generate JSON report string (handles non-serializable values gracefully) */
export function generateJsonReport(result: EvaluationResult): string {
  try {
    return JSON.stringify(result, null, 2);
  } catch (err) {
    console.warn(
      `JSON serialization failed: ${err instanceof Error ? err.message : err}`,
    );
    // Fallback: strip non-serializable values
    return JSON.stringify(
      result,
      (_key, value) => {
        if (typeof value === "bigint") return Number(value);
        if (typeof value === "function") return undefined;
        return value;
      },
      2,
    );
  }
}
