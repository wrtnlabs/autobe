import { ITraceable } from "./AutoBeAnalyzeDocumentTraceable";

/**
 * Functional requirement within a use case (EARS format).
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentCapabilityRequirement extends ITraceable {
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
}

/**
 * Use case within a capability.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentCapabilityUseCase {
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
  requirements: Array<AutoBeAnalyzeDocumentCapabilityRequirement>;
}

/**
 * System capability entry.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentCapabilityEntry extends ITraceable {
  /** Capability name */
  name: string;
  /** Capability description */
  description: string;
  /** Related actor name list */
  actors: string[];
  /** Use case list */
  useCases: Array<AutoBeAnalyzeDocumentCapabilityUseCase>;
}

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
  capabilities: Array<AutoBeAnalyzeDocumentCapabilityEntry>;
}
