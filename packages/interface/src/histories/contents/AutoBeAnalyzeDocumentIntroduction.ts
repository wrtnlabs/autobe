import { ITraceable } from "./AutoBeAnalyzeDocumentTraceable";

/**
 * System scope definition.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentIntroductionScope {
  /** Items included in v1 */
  included: string[];
  /** Items explicitly excluded from v1 */
  excluded: string[];
}

/**
 * Domain glossary entry.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentIntroductionGlossary extends ITraceable {
  /** Term */
  term: string;
  /** Definition */
  definition: string;
}

/**
 * External reference document/standard.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentIntroductionReference extends ITraceable {
  /** Reference document name */
  name: string;
  /** Reference document description */
  description: string;
}

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
  scope: AutoBeAnalyzeDocumentIntroductionScope;

  /** Target audience of the document */
  audience: string;

  /** Domain glossary definitions */
  glossary: Array<AutoBeAnalyzeDocumentIntroductionGlossary>;

  /** External reference documents/standards */
  references: Array<AutoBeAnalyzeDocumentIntroductionReference>;
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
