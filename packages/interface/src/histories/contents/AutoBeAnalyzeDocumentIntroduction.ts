import { ITraceable } from "./AutoBeAnalyzeDocumentTraceable";

/**
 * SRS Section 1: Introduction.
 *
 * Structures purpose, scope, audience, glossary, and references. Used by
 * downstream phases for terminology consistency and system scope
 * determination.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentIntroduction {
  /** Why the system exists (purpose statement) */
  purpose: string;

  /** System scope definition */
  scope: AutoBeAnalyzeDocumentIntroduction.Scope;

  /** Target audience of the document */
  audience: string;

  /** Domain glossary definitions */
  glossary: Array<AutoBeAnalyzeDocumentIntroduction.GlossaryEntry & ITraceable>;

  /** External reference documents/standards */
  references: Array<
    AutoBeAnalyzeDocumentIntroduction.ReferenceEntry & ITraceable
  >;
}
export namespace AutoBeAnalyzeDocumentIntroduction {
  export interface Scope {
    /** Items included in v1 */
    included: string[];
    /** Items explicitly excluded from v1 */
    excluded: string[];
  }
  export interface GlossaryEntry {
    /** Term */
    term: string;
    /** Definition */
    definition: string;
  }
  export interface ReferenceEntry {
    /** Reference document name */
    name: string;
    /** Reference document description */
    description: string;
  }
}
