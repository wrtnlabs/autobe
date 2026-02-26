import { ITraceable } from "./AutoBeAnalyzeDocumentTraceable";

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
  authRequirements: Array<{ text: string } & ITraceable>;

  /** Data protection requirements */
  dataProtection: Array<{ text: string } & ITraceable>;

  /** Quality attribute scenarios (QAS) */
  qualityAttributes: Array<
    {
      /** Quality attribute (e.g., "Reliability", "Maintainability") */
      attribute: string;
      /** Scenario description */
      scenario: string;
      /** Measurement criteria */
      measure: string;
    } & ITraceable
  >;
}
