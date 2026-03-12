// ─── Types ───

/**
 * A single extracted decision from one file's section content.
 *
 * Decisions are binary/discrete choices embedded in prose, e.g.:
 *
 * - "password change requires current password" → topic: "password_change",
 *   decision: "requires_current_password", value: "yes"
 * - "deleted email can be reused" → topic: "deleted_email", decision:
 *   "can_be_reused", value: "yes"
 */
export interface IExtractedDecision {
  /** Normalized topic grouping (e.g., "password_change", "email_reuse") */
  topic: string;

  /** Specific decision within the topic (e.g., "requires_current_password") */
  decision: string;

  /** The value of the decision (e.g., "yes", "no", "soft_delete", "hard_delete") */
  value: string;

  /** Evidence quote from the source text */
  evidence: string;
}

/** Decisions extracted from a single file, returned by the extraction LLM. */
export interface IFileDecisions {
  /** The filename this was extracted from */
  filename: string;

  /** All decisions extracted from this file */
  decisions: IExtractedDecision[];
}

/**
 * A conflict between two or more files that state different values for the same
 * topic+decision.
 */
export interface IDecisionConflict {
  /** The topic of the conflict */
  topic: string;

  /** The specific decision that conflicts */
  decision: string;

  /** All differing values with their source files and evidence */
  values: Array<{
    value: string;
    files: string[];
    evidence: string;
  }>;
}

// ─── Main Detection ───

/**
 * Detect decision-level conflicts across all files.
 *
 * Groups all extracted decisions by `topic + decision` key, then finds cases
 * where different files assign different values to the same key.
 *
 * This catches prose-level contradictions like:
 *
 * - File A: "password change requires current password" (yes)
 * - File B: "password change does not require current password" (no)
 */
export const detectDecisionConflicts = (props: {
  fileDecisions: IFileDecisions[];
}): IDecisionConflict[] => {
  // Group by topic+decision
  const groups: Map<
    string,
    Array<{ value: string; filename: string; evidence: string }>
  > = new Map();

  for (const { filename, decisions } of props.fileDecisions) {
    for (const d of decisions) {
      const key = `${normalizeKey(d.topic)}::${normalizeKey(d.decision)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push({
        value: normalizeValue(d.value),
        filename,
        evidence: d.evidence,
      });
    }
  }

  // Find conflicts: same key, different values
  const conflicts: IDecisionConflict[] = [];

  for (const [key, entries] of groups) {
    // Group entries by value
    const byValue: Map<
      string,
      Array<{ filename: string; evidence: string }>
    > = new Map();
    for (const entry of entries) {
      if (!byValue.has(entry.value)) byValue.set(entry.value, []);
      byValue.get(entry.value)!.push({
        filename: entry.filename,
        evidence: entry.evidence,
      });
    }

    // If more than one distinct value exists → conflict
    if (byValue.size <= 1) continue;

    const [topic, decision] = key.split("::");
    conflicts.push({
      topic: topic!,
      decision: decision!,
      values: [...byValue.entries()].map(([value, sources]) => ({
        value,
        files: sources.map((s) => s.filename),
        evidence: sources[0]?.evidence ?? "",
      })),
    });
  }

  return conflicts;
};

/**
 * Build a map from filename → list of decision conflict feedback strings.
 *
 * Each file involved in a conflict gets feedback describing the contradiction.
 */
export const buildFileDecisionConflictMap = (
  conflicts: IDecisionConflict[],
): Map<string, string[]> => {
  const map: Map<string, string[]> = new Map();

  for (const conflict of conflicts) {
    const valueSummary = conflict.values
      .map((v) => `"${v.value}" in [${v.files.join(", ")}]`)
      .join(" vs ");

    const feedback =
      `Decision conflict: ${conflict.topic}.${conflict.decision} — ${valueSummary}. ` +
      `Files must agree on this decision. Align with the canonical source.`;

    // Add feedback to ALL files involved in this conflict
    for (const valueGroup of conflict.values) {
      for (const filename of valueGroup.files) {
        if (!map.has(filename)) map.set(filename, []);
        map.get(filename)!.push(feedback);
      }
    }
  }

  return map;
};

// ─── Helpers ───

/**
 * Normalize a key string for grouping: lowercase, replace whitespace/special
 * chars with underscore, trim.
 */
function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[\s\-\.]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

/** Normalize a value for comparison: lowercase, trim, collapse whitespace. */
function normalizeValue(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}
