import { tags } from "typia";

/**
 * SRS Section 5 — System Physical and Performance Characteristics.
 *
 * Separates physical constraints (deployment, hardware, environment) from
 * quantified performance requirements with measurable metrics. This
 * section corresponds to the "System Physical and Performance
 * Characteristics" clause of ISO/IEC/IEEE 29148:2018.
 *
 * Both arrays may be empty when the system has no notable physical
 * constraints or quantified performance targets.
 *
 * @author juntak
 */
export interface AutoBeAnalyzeDocumentPhysicalPerformance {
  /**
   * Physical and deployment constraints.
   */
  physicalConstraints:
    AutoBeAnalyzeDocumentPhysicalPerformance.PhysicalConstraint[];

  /**
   * Quantified performance requirements.
   *
   * Every entry MUST include a non-empty {@link PerformanceRequirement.metric}.
   * A missing or empty metric triggers `MISSING_PERFORMANCE_METRIC` FAIL.
   */
  performanceRequirements:
    AutoBeAnalyzeDocumentPhysicalPerformance.PerformanceRequirement[];

  /**
   * Traceability link back to the evidence layer.
   *
   * MUST contain at least one sectionId. Validated as FAIL
   * (`EMPTY_SOURCE_SECTION_IDS`) if empty.
   */
  sourceSectionIds: string[] & tags.MinItems<1>;
}
export namespace AutoBeAnalyzeDocumentPhysicalPerformance {
  /**
   * A physical or deployment constraint.
   */
  export interface PhysicalConstraint {
    /**
     * Stable identifier.
     *
     * @example "PC-001"
     */
    constraintId: string & tags.MinLength<1>;

    /**
     * Category of constraint.
     */
    category: "deployment" | "hardware" | "environment" | "network" | "other";

    /**
     * Short title.
     */
    title: string;

    /**
     * Description of the constraint.
     */
    description: string;

    /**
     * Traceability link back to the evidence layer.
     *
     * MUST contain at least one sectionId.
     */
    sourceSectionIds: string[] & tags.MinItems<1>;
  }

  /**
   * A quantified performance requirement.
   */
  export interface PerformanceRequirement {
    /**
     * Stable identifier.
     *
     * @example "PERF-001"
     */
    requirementId: string & tags.MinLength<1>;

    /**
     * Category of performance characteristic.
     */
    category:
      | "latency"
      | "throughput"
      | "capacity"
      | "resourceUsage"
      | "other";

    /**
     * Short title.
     */
    title: string;

    /**
     * Description of the requirement.
     */
    description: string;

    /**
     * Quantified metric with threshold.
     *
     * This field is REQUIRED and must not be empty. A missing or blank
     * value triggers `MISSING_PERFORMANCE_METRIC` FAIL.
     *
     * @example "p99 latency < 200ms"
     * @example "1000 RPS sustained"
     */
    metric: string & tags.MinLength<1>;

    /**
     * Traceability link back to the evidence layer.
     *
     * MUST contain at least one sectionId.
     */
    sourceSectionIds: string[] & tags.MinItems<1>;
  }
}
