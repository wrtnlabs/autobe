import { AutoBeAnalyzeDocumentCapability } from "./AutoBeAnalyzeDocumentCapability";
import { AutoBeAnalyzeDocumentExternalInterface } from "./AutoBeAnalyzeDocumentExternalInterface";
import { AutoBeAnalyzeDocumentIntroduction } from "./AutoBeAnalyzeDocumentIntroduction";
import { AutoBeAnalyzeDocumentPhysicalPerformance } from "./AutoBeAnalyzeDocumentPhysicalPerformance";
import { AutoBeAnalyzeDocumentSecurityQuality } from "./AutoBeAnalyzeDocumentSecurityQuality";
import { AutoBeAnalyzeDocumentSystemOverview } from "./AutoBeAnalyzeDocumentSystemOverview";

/**
 * Semantically typed SRS (Software Requirements Specification).
 *
 * Structured according to the **ISO/IEC/IEEE 29148:2018 Analyst View**,
 * consisting of exactly 6 top-level sections. This structure is optimised
 * for downstream code generation (Database / Interface / Test / Realize).
 *
 * API-level detail (endpoints, request/response DTOs) is explicitly
 * excluded; those belong to the Interface Phase.
 *
 * Every section and every traceable entry MUST have `sourceSectionIds`
 * referencing at least one
 * {@link AutoBeAnalyzeDocumentSection.sectionId}.
 *
 * Field names follow the original ISO 29148 clause titles and are treated
 * as a long-term compatibility contract — the same structure may be used
 * as a prompt output schema, benchmark fixture, or log format.
 *
 * @author juntak
 */
export interface AutoBeAnalyzeDocumentSrs {
  /**
   * Section 1 — Introduction.
   *
   * Purpose, scope, audience, definitions, and references.
   */
  introduction: AutoBeAnalyzeDocumentIntroduction;

  /**
   * Section 2 — System Overview.
   *
   * High-level system context including a structured context diagram,
   * stakeholders, assumptions, and constraints.
   */
  systemOverview: AutoBeAnalyzeDocumentSystemOverview;

  /**
   * Section 3 — External Interface Requirements.
   *
   * Interfaces with external systems, databases, services, and protocols.
   * Does NOT include API endpoint/DTO specs (Interface Phase scope).
   */
  externalInterfaceRequirements: AutoBeAnalyzeDocumentExternalInterface;

  /**
   * Section 4 — System Capabilities and Functional Requirements.
   *
   * Capabilities, use cases, and detailed functional requirements with
   * cross-references between them.
   */
  systemCapabilitiesAndFunctionalRequirements: AutoBeAnalyzeDocumentCapability;

  /**
   * Section 5 — System Physical and Performance Characteristics.
   *
   * Physical constraints (deployment, hardware, environment) and
   * quantified performance requirements with metrics.
   */
  systemPhysicalAndPerformanceCharacteristics: AutoBeAnalyzeDocumentPhysicalPerformance;

  /**
   * Section 6 — System Security and Quality Attributes.
   *
   * Security requirements and Quality Attribute Scenarios (QAS) for
   * availability, reliability, maintainability, etc.
   */
  systemSecurityAndQualityAttributes: AutoBeAnalyzeDocumentSecurityQuality;
}
