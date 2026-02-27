import { ITraceable } from "./AutoBeAnalyzeDocumentTraceable";

/**
 * SRS Section 2: System Overview.
 *
 * Defines system boundaries, context, stakeholders, and
 * assumptions/constraints. The reference layer for determining "how far the
 * system extends."
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentSystemOverview {
  /** System context description */
  contextDescription: string;

  /** Stakeholder list */
  stakeholders: Array<
    {
      /** Stakeholder name/role */
      name: string;
      /** Role within the system */
      role: string;
      /** Key concerns */
      concerns: string[];
    } & ITraceable
  >;

  /** Assumptions about the system operating environment */
  assumptions: Array<{ text: string } & ITraceable>;

  /** Known constraints */
  constraints: Array<
    {
      /** Constraint description */
      text: string;
      /** Constraint type */
      kind: "technical" | "business" | "regulatory";
    } & ITraceable
  >;
}
