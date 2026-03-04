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
 * Each `AutoBeAnalyzeFile` holds its own per-file SRS with only the categories
 * relevant to that file's content. `selectedCategories` tracks which categories
 * are populated. All categories are optional at the per-file level; the three
 * project-level required categories (`introduction`, `systemOverview`,
 * `capabilities`) must exist across the full set of files but need not all
 * appear in every single file.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentSrs {
  /**
   * List of SRS category keys populated in this file's SRS.
   *
   * Only categories relevant to this file's content are included. The three
   * project-level required categories (introduction, systemOverview,
   * capabilities) must exist across the full set of files but need not all
   * appear in every single file.
   */
  selectedCategories: AutoBeAnalyzeDocumentSrsCategory[];

  // ──────────────────────────────────────────────
  // All categories are optional at the per-file level.
  // Project-level required: introduction, systemOverview, capabilities
  // ──────────────────────────────────────────────

  /** SRS Section 1: purpose, scope, glossary, references */
  introduction?: AutoBeAnalyzeDocumentIntroduction;

  /** SRS Section 2: system context, stakeholders, assumptions/constraints */
  systemOverview?: AutoBeAnalyzeDocumentSystemOverview;

  /** SRS Section 4: Capability → Use Case → Functional Requirement */
  capabilities?: AutoBeAnalyzeDocumentCapability;

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

/**
 * Available SRS category keys.
 *
 * Project-level required 3: introduction, systemOverview, capabilities.
 * Optional 7: the rest. At the per-file level all are optional.
 */
export type AutoBeAnalyzeDocumentSrsCategory =
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

/** Required categories that must exist across the full set of files */
export const AutoBeAnalyzeDocumentSrsRequiredCategories: readonly AutoBeAnalyzeDocumentSrsCategory[] =
  ["introduction", "systemOverview", "capabilities"] as const;

/** All available categories */
export const AutoBeAnalyzeDocumentSrsAllCategories: readonly AutoBeAnalyzeDocumentSrsCategory[] =
  [
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
