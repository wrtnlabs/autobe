import { tags } from "typia";

/**
 * SRS Section 4 — System Capabilities and Functional Requirements.
 *
 * Organises requirements into a three-tier hierarchy:
 * **Capability → Use Case → Functional Requirement**, with cross-cutting
 * Business Rules. This section corresponds to the "System Capabilities
 * and Functional Requirements" clause of ISO/IEC/IEEE 29148:2018.
 *
 * Capabilities and Functional Requirements are required (`MinItems<1>`)
 * because they form the primary anchor for downstream Database and
 * Interface phases. Use Cases and Business Rules may be empty when the
 * domain does not warrant them.
 *
 * @author juntak
 */
export interface AutoBeAnalyzeDocumentCapability {
  /**
   * High-level system capabilities.
   *
   * At least one capability is required — it serves as the top-level
   * anchor from which use cases and functional requirements are derived.
   */
  capabilities:
    & AutoBeAnalyzeDocumentCapability.Capability[]
    & tags.MinItems<1>;

  /**
   * Use case descriptions.
   *
   * May be empty when the domain is simple enough that capabilities
   * map directly to functional requirements.
   */
  useCases: AutoBeAnalyzeDocumentCapability.UseCase[];

  /**
   * Detailed functional requirements.
   *
   * At least one functional requirement is required — this is the core
   * deliverable of the Analyze Phase.
   */
  functionalRequirements:
    & AutoBeAnalyzeDocumentCapability.FunctionalRequirement[]
    & tags.MinItems<1>;

  /**
   * Domain-level business rules that constrain behaviour.
   *
   * Business rules are invariants independent of any specific feature.
   * They often map to database constraints or cross-cutting validation.
   * May be empty.
   */
  businessRules: AutoBeAnalyzeDocumentCapability.BusinessRule[];

  /**
   * Traceability link back to the evidence layer.
   *
   * MUST contain at least one sectionId. Validated as FAIL
   * (`EMPTY_SOURCE_SECTION_IDS`) if empty.
   */
  sourceSectionIds: string[] & tags.MinItems<1>;
}
export namespace AutoBeAnalyzeDocumentCapability {
  /**
   * A high-level system capability.
   */
  export interface Capability {
    /**
     * Stable identifier.
     *
     * @example "CAP-001"
     */
    capabilityId: string & tags.MinLength<1>;

    /**
     * Short title.
     */
    title: string;

    /**
     * Description of the capability.
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
   * A use case description.
   */
  export interface UseCase {
    /**
     * Stable identifier.
     *
     * @example "UC-001"
     */
    useCaseId: string & tags.MinLength<1>;

    /**
     * Short title.
     */
    title: string;

    /**
     * Description including preconditions, main flow, and postconditions.
     */
    description: string;

    /**
     * Free-form actor labels involved in this use case.
     *
     * Each entry is a plain descriptive string (e.g. "guest", "member",
     * "shopOwner"). There is no centralised actor registry in the Analyze
     * Phase; downstream phases that need a formal actor mapping are
     * responsible for resolving these labels.
     */
    actors: string[];

    /**
     * Related capability IDs.
     *
     * Every ID must reference an existing
     * {@link Capability.capabilityId}. Dangling references trigger
     * `DANGLING_RELATED_ID` FAIL.
     */
    relatedCapabilityIds: string[];

    /**
     * Traceability link back to the evidence layer.
     *
     * MUST contain at least one sectionId.
     */
    sourceSectionIds: string[] & tags.MinItems<1>;
  }

  /**
   * A single functional requirement.
   *
   * Describes one discrete capability the system must provide. The
   * description must be concrete enough to derive database schema entries
   * and test cases without further clarification.
   */
  export interface FunctionalRequirement {
    /**
     * Stable requirement identifier.
     *
     * @example "FR-001"
     */
    requirementId: string & tags.MinLength<1>;

    /**
     * Short human-readable title.
     */
    title: string;

    /**
     * Full description in EARS (Easy Approach to Requirements Syntax)
     * format or equivalent unambiguous prose.
     */
    description: string;

    /**
     * Priority for implementation ordering (MoSCoW).
     */
    priority: "must" | "should" | "could" | "wont";

    /**
     * Free-form actor labels relevant to this requirement.
     *
     * May be empty when the requirement is system-initiated (e.g. a
     * scheduled job or an internal invariant).
     */
    actors: string[];

    /**
     * Related capability IDs (optional cross-reference).
     *
     * Dangling references trigger `DANGLING_RELATED_ID` FAIL.
     */
    relatedCapabilityIds?: string[];

    /**
     * Related use case IDs (optional cross-reference).
     *
     * Dangling references trigger `DANGLING_RELATED_ID` FAIL.
     */
    relatedUseCaseIds?: string[];

    /**
     * Traceability link back to the evidence layer.
     *
     * MUST contain at least one sectionId.
     */
    sourceSectionIds: string[] & tags.MinItems<1>;
  }

  /**
   * A domain-level business rule.
   *
   * Business rules are invariants that constrain how the system behaves,
   * independent of any specific feature. They often map to database
   * constraints or cross-cutting validation logic.
   */
  export interface BusinessRule {
    /**
     * Stable rule identifier.
     *
     * @example "BR-001"
     */
    ruleId: string & tags.MinLength<1>;

    /**
     * Short human-readable title.
     */
    title: string;

    /**
     * Full description of the invariant or policy.
     */
    description: string;

    /**
     * Severity if the rule is violated.
     */
    severity: "critical" | "major" | "minor";

    /**
     * Traceability link back to the evidence layer.
     *
     * MUST contain at least one sectionId.
     */
    sourceSectionIds: string[] & tags.MinItems<1>;
  }
}
