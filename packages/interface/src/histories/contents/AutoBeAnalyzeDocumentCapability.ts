import { ITraceable } from "./AutoBeAnalyzeDocumentTraceable";

/**
 * SRS Section 4: System Capabilities and Functional Requirements.
 *
 * Capability → Use Case → Functional Requirement hierarchy. The **core**
 * artifact of the Analyze Phase, used as direct input for DB schema and API
 * design.
 *
 * Required category: always included.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentCapability {
  /** System capability list */
  capabilities: Array<
    {
      /** Capability name */
      name: string;
      /** Capability description */
      description: string;
      /** Related actor name list */
      actors: string[];
      /** Use case list */
      useCases: Array<{
        /** Use case name */
        name: string;
        /** Preconditions */
        preconditions: string[];
        /** Postconditions */
        postconditions: string[];
        /** Main flow steps */
        mainFlow: string[];
        /** Alternative flows */
        alternativeFlows: string[];
        /** Detailed requirements (EARS format) */
        requirements: Array<
          {
            /** Requirement text */
            text: string;
            /** Requirement kind */
            kind:
              | "functional"
              | "data-constraint"
              | "permission"
              | "state-transition"
              | "error-handling"
              | "edge-case";
            /** Priority */
            priority: "must" | "should" | "could";
          } & ITraceable
        >;
      }>;
    } & ITraceable
  >;
}
