import { ITraceable } from "./AutoBeAnalyzeDocumentTraceable";

/**
 * Authentication/authorization requirement.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentSecurityQualityAuth extends ITraceable {
  /** Requirement text */
  text: string;
}

/**
 * Data protection requirement.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentSecurityQualityDataProtection extends ITraceable {
  /** Requirement text */
  text: string;
}

/**
 * Quality attribute scenario (QAS).
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentSecurityQualityAttribute extends ITraceable {
  /** Quality attribute (e.g., "Reliability", "Maintainability") */
  attribute: string;
  /** Scenario description */
  scenario: string;
  /** Measurement criteria */
  measure: string;
}

/**
 * SRS Section 6: Security and Quality Attributes.
 *
 * Defines security requirements + quality attribute scenarios (QAS). Enforces
 * quality requirements into a verifiable structure.
 *
 * Optional category: selected for projects that explicitly need
 * security/quality requirements.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentSecurityQuality {
  /** Authentication/authorization requirements */
  authRequirements: Array<AutoBeAnalyzeDocumentSecurityQualityAuth>;

  /** Data protection requirements */
  dataProtection: Array<AutoBeAnalyzeDocumentSecurityQualityDataProtection>;

  /** Quality attribute scenarios (QAS) */
  qualityAttributes: Array<AutoBeAnalyzeDocumentSecurityQualityAttribute>;
}
