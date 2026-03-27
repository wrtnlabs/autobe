/**
 * Extracts binary/discrete decisions from a file's sections for cross-file
 * contradiction detection.
 */
export interface IAutoBeAnalyzeExtractDecisionsApplication {
  /** Extract all binary/discrete decisions from a single file's sections. */
  process(props: IAutoBeAnalyzeExtractDecisionsApplicationProps): void;
}

export interface IAutoBeAnalyzeExtractDecisionsApplicationProps {
  /**
   * Reasoning about your current state: what's missing (preliminary) or what
   * you accomplished (completion).
   */
  thinking?: string | null;

  /** Action to perform: submit extracted decisions. */
  request: IAutoBeAnalyzeExtractDecisionsApplicationComplete;
}

/** Request to complete the decision extraction. */
export interface IAutoBeAnalyzeExtractDecisionsApplicationComplete {
  /** Type discriminator for completion request. */
  type: "complete";

  /**
   * All binary/discrete decisions extracted from this file. Use normalized
   * names. Return an empty array if the file has no extractable decisions.
   */
  decisions: IAutoBeAnalyzeExtractedDecision[];
}

/** A single extracted decision from the file's content. */
export interface IAutoBeAnalyzeExtractedDecision {
  /**
   * Normalized topic grouping (lowercase, underscore-separated).
   *
   * @example
   *   (password_change, "todo_deletion", "edit_history");
   */
  topic: string;

  /**
   * Specific decision within the topic (lowercase, underscore-separated).
   *
   * @example
   *   (requires_current_password, "deletion_method", "recorded_values");
   */
  decision: string;

  /**
   * Binary: "yes"/"no". Discrete: short descriptive string.
   *
   * @example
   *   (yes, "soft_delete", "hard_delete");
   */
  value: string;

  /** Short quote (1-2 sentences) from the source text supporting this decision. */
  evidence: string;
}
