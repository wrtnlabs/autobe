import { AutoBeAnalyzeDocumentActorPermission } from "./AutoBeAnalyzeDocumentActorPermission";
import { AutoBeAnalyzeDocumentCapability } from "./AutoBeAnalyzeDocumentCapability";
import { AutoBeAnalyzeDocumentDataDictionary } from "./AutoBeAnalyzeDocumentDataDictionary";
import { AutoBeAnalyzeDocumentDomainModel } from "./AutoBeAnalyzeDocumentDomainModel";
import { AutoBeAnalyzeDocumentExternalInterface } from "./AutoBeAnalyzeDocumentExternalInterface";
import { AutoBeAnalyzeDocumentIntroduction } from "./AutoBeAnalyzeDocumentIntroduction";
import { AutoBeAnalyzeDocumentPhysicalPerformance } from "./AutoBeAnalyzeDocumentPhysicalPerformance";
import { AutoBeAnalyzeDocumentSecurityQuality } from "./AutoBeAnalyzeDocumentSecurityQuality";
import { AutoBeAnalyzeDocumentSystemOverview } from "./AutoBeAnalyzeDocumentSystemOverview";
import { AutoBeAnalyzeDocumentWorkflow } from "./AutoBeAnalyzeDocumentWorkflow";

/**
 * Semantic Layer: composite structure of 29148-based SRS sections.
 *
 * A set of SRS categories dynamically selected by the LLM based on project
 * characteristics. 3 required categories (introduction, systemOverview,
 * capabilities) are always present; 7 optional categories are included
 * depending on the project.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentSrs {
  /**
   * List of SRS category keys selected by the LLM.
   *
   * Required categories (introduction, systemOverview, capabilities) are always
   * included; optional categories are determined by project characteristics.
   */
  selectedCategories: AutoBeAnalyzeDocumentSrs.Category[];

  // ──────────────────────────────────────────────
  // Required categories (always present)
  // ──────────────────────────────────────────────

  /** SRS Section 1: purpose, scope, glossary, references */
  introduction: AutoBeAnalyzeDocumentIntroduction;

  /** SRS Section 2: system context, stakeholders, assumptions/constraints */
  systemOverview: AutoBeAnalyzeDocumentSystemOverview;

  /** SRS Section 4: Capability → Use Case → Functional Requirement */
  capabilities: AutoBeAnalyzeDocumentCapability;

  // ──────────────────────────────────────────────
  // Optional categories (dynamically selected by LLM)
  // ──────────────────────────────────────────────

  /** SRS Section 3: external system integrations */
  externalInterface?: AutoBeAnalyzeDocumentExternalInterface;

  /** SRS Section 5: deployment/physical constraints, performance requirements */
  physicalPerformance?: AutoBeAnalyzeDocumentPhysicalPerformance;

  /** SRS Section 6: security, quality attributes */
  securityQuality?: AutoBeAnalyzeDocumentSecurityQuality;

  /** Extension: domain entities/relationships/business rules */
  domainModel?: AutoBeAnalyzeDocumentDomainModel;

  /** Extension: per-actor permission mapping */
  actorPermissionMatrix?: AutoBeAnalyzeDocumentActorPermission;

  /** Extension: state transitions/workflows */
  workflowStateMachine?: AutoBeAnalyzeDocumentWorkflow;

  /** Extension: per-field constraints/validation rules */
  dataDictionary?: AutoBeAnalyzeDocumentDataDictionary;
}

export namespace AutoBeAnalyzeDocumentSrs {
  /**
   * Available SRS category keys.
   *
   * Required 3: introduction, systemOverview, capabilities Optional 7: the rest
   */
  export type Category =
    | "introduction"
    | "systemOverview"
    | "externalInterface"
    | "capabilities"
    | "physicalPerformance"
    | "securityQuality"
    | "domainModel"
    | "actorPermissionMatrix"
    | "workflowStateMachine"
    | "dataDictionary";

  /** Required categories that must always be included */
  export const REQUIRED_CATEGORIES: readonly Category[] = [
    "introduction",
    "systemOverview",
    "capabilities",
  ] as const;

  /** All available categories */
  export const ALL_CATEGORIES: readonly Category[] = [
    "introduction",
    "systemOverview",
    "externalInterface",
    "capabilities",
    "physicalPerformance",
    "securityQuality",
    "domainModel",
    "actorPermissionMatrix",
    "workflowStateMachine",
    "dataDictionary",
  ] as const;
}
