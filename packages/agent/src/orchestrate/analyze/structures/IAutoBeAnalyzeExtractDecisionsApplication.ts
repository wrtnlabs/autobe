/**
 * Application interface for the Key Decision Extractor agent.
 *
 * This agent extracts binary/discrete decisions from a single file's section
 * content as structured data. The extracted decisions are then compared
 * programmatically across files to detect contradictions.
 */
export interface IAutoBeAnalyzeExtractDecisionsApplication {
  /**
   * Process decision extraction from a single file's sections.
   *
   * Reads the file content and extracts all binary/discrete decisions as
   * structured data for cross-file contradiction detection.
   *
   * @param props Request containing extracted decisions
   */
  process(props: IAutoBeAnalyzeExtractDecisionsApplicationProps): void;
}

export interface IAutoBeAnalyzeExtractDecisionsApplicationProps {
  /**
   * Think before you act.
   *
   * Before completing extraction, reflect on what decisions this file makes:
   *
   * - What binary (yes/no) choices does this file assert?
   * - What discrete behavioral choices does this file make?
   * - Are there decisions where another file could reasonably disagree?
   */
  thinking?: string | null;

  /** Extraction result. */
  request: IAutoBeAnalyzeExtractDecisionsApplicationComplete;
}

/** Request to complete the decision extraction. */
export interface IAutoBeAnalyzeExtractDecisionsApplicationComplete {
  /** Type discriminator for the request. */
  type: "complete";

  /**
   * All binary/discrete decisions extracted from this file.
   *
   * Each decision represents a specific behavioral choice that the file makes.
   * Use normalized topic names, decision names, and values.
   *
   * Return an empty array if the file has no extractable decisions (e.g., table
   * of contents).
   */
  decisions: IAutoBeAnalyzeExtractedDecision[];
}

/** A single extracted decision from the file's content. */
export interface IAutoBeAnalyzeExtractedDecision {
  /**
   * Normalized topic grouping.
   *
   * Use lowercase, underscore-separated names.
   *
   * @example
   *   (password_change, "todo_deletion", "edit_history");
   */
  topic: string;

  /**
   * Specific decision within the topic.
   *
   * Use lowercase, underscore-separated, descriptive names.
   *
   * @example
   *   (requires_current_password, "deletion_method", "recorded_values");
   */
  decision: string;

  /**
   * The value of the decision.
   *
   * For binary decisions: "yes" or "no". For discrete decisions: short
   * descriptive string.
   *
   * @example
   *   (yes,
   *     "no",
   *     "soft_delete",
   *     "hard_delete",
   *     "new_values",
   *     "previous_values");
   */
  value: string;

  /**
   * Short quote (1-2 sentences) from the source text supporting this decision.
   *
   * @example
   *   "A user may change their password only by providing their
   *   current password."
   */
  evidence: string;
}
