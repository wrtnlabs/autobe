import { ITraceable } from "./AutoBeAnalyzeDocumentTraceable";

/**
 * Stakeholder entry.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentSystemOverviewStakeholder extends ITraceable {
  /** Stakeholder name/role */
  name: string;
  /** Role within the system */
  role: string;
  /** Key concerns */
  concerns: string[];
}

/**
 * Assumption about the system operating environment.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentSystemOverviewAssumption extends ITraceable {
  /** Assumption text */
  text: string;
}

/**
 * Known constraint on the system.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentSystemOverviewConstraint extends ITraceable {
  /** Constraint description */
  text: string;
  /** Constraint type */
  kind: "technical" | "business" | "regulatory";
}

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
  stakeholders: Array<AutoBeAnalyzeDocumentSystemOverviewStakeholder>;

  /** Assumptions about the system operating environment */
  assumptions: Array<AutoBeAnalyzeDocumentSystemOverviewAssumption>;

  /** Known constraints */
  constraints: Array<AutoBeAnalyzeDocumentSystemOverviewConstraint>;
}
