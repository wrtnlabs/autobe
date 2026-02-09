import { tags } from "typia";

/**
 * SRS Section 6 — System Security and Quality Attributes.
 *
 * Security requirements and Quality Attribute Scenarios (QAS) following
 * the SEI/CMU 6-part structure for measurable quality attributes. This
 * section corresponds to the "System Security and Quality Attributes"
 * clause of ISO/IEC/IEEE 29148:2018.
 *
 * An empty `qualityAttributeScenarios` array triggers `EMPTY_QAS_LIST`
 * WARN during validation.
 *
 * @author juntak
 */
export interface AutoBeAnalyzeDocumentSecurityQuality {
  /**
   * Security requirements.
   */
  securityRequirements:
    AutoBeAnalyzeDocumentSecurityQuality.SecurityRequirement[];

  /**
   * Quality Attribute Scenarios (QAS) for non-security quality attributes.
   *
   * Each scenario follows the SEI/CMU 6-part structure:
   * Source → Stimulus → Artifact → Environment → Response → Response
   * Measure.
   */
  qualityAttributeScenarios:
    AutoBeAnalyzeDocumentSecurityQuality.QualityAttributeScenario[];

  /**
   * Traceability link back to the evidence layer.
   *
   * MUST contain at least one sectionId. Validated as FAIL
   * (`EMPTY_SOURCE_SECTION_IDS`) if empty.
   */
  sourceSectionIds: string[] & tags.MinItems<1>;
}
export namespace AutoBeAnalyzeDocumentSecurityQuality {
  /**
   * A security requirement.
   */
  export interface SecurityRequirement {
    /**
     * Stable identifier.
     *
     * @example "SEC-001"
     */
    requirementId: string & tags.MinLength<1>;

    /**
     * Category of security concern.
     */
    category:
      | "authentication"
      | "authorization"
      | "dataProtection"
      | "auditLogging"
      | "inputValidation"
      | "cryptography"
      | "other";

    /**
     * Short title.
     */
    title: string;

    /**
     * Description of the security requirement.
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
   * Quality Attribute Scenario (QAS).
   *
   * Follows the SEI/CMU 6-part structure:
   * Source → Stimulus → Artifact → Environment → Response → Response
   * Measure.
   */
  export interface QualityAttributeScenario {
    /**
     * Stable identifier.
     *
     * @example "QAS-001"
     */
    scenarioId: string & tags.MinLength<1>;

    /**
     * Quality attribute being addressed.
     */
    attribute:
      | "availability"
      | "reliability"
      | "scalability"
      | "maintainability"
      | "testability"
      | "usability"
      | "interoperability"
      | "other";

    /**
     * Short title.
     */
    title: string;

    /**
     * Source of the stimulus (who or what generates it).
     *
     * @example "External user", "Scheduled job", "Upstream service failure"
     */
    source: string;

    /**
     * The stimulus (event or condition).
     *
     * @example "1000 concurrent requests", "Database connection lost"
     */
    stimulus: string;

    /**
     * The artifact being stimulated.
     *
     * @example "Order processing service", "Authentication module"
     */
    artifact: string;

    /**
     * The environment in which the scenario occurs.
     *
     * @example "Normal operation", "Peak load", "Degraded mode"
     */
    environment: string;

    /**
     * The expected response of the system.
     *
     * @example "Gracefully degrade and queue requests"
     */
    response: string;

    /**
     * The measurable response measure.
     *
     * @example "Recovery within 30 seconds", "99.9% success rate"
     */
    responseMeasure: string;

    /**
     * Traceability link back to the evidence layer.
     *
     * MUST contain at least one sectionId.
     */
    sourceSectionIds: string[] & tags.MinItems<1>;
  }
}
