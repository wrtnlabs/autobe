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
  scope: {
    /** Items included in v1 */
    included: string[];
    /** Items explicitly excluded from v1 */
    excluded: string[];
  };

  /** Target audience of the document */
  audience: string;

  /** Domain glossary definitions */
  glossary: Array<
    {
      /** Term */
      term: string;
      /** Definition */
      definition: string;
    } & ITraceable
  >;

  /** External reference documents/standards */
  references: Array<
    {
      /** Reference document name */
      name: string;
      /** Reference document description */
      description: string;
    } & ITraceable
  >;
}
