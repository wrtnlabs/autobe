import { tags } from "typia";

/**
 * SRS Section 2 — System Overview.
 *
 * Provides a high-level description of the system, a structured context
 * diagram (nodes + edges), stakeholders, assumptions, and constraints.
 * This section corresponds to the "System Overview" clause of
 * ISO/IEC/IEEE 29148:2018.
 *
 * The context diagram is stored as pure data (nodes and edges); rendering
 * is a downstream responsibility.
 *
 * @author juntak
 */
export interface AutoBeAnalyzeDocumentSystemOverview {
  /**
   * Brief description of the system's purpose and boundaries.
   */
  description: string;

  /**
   * Structured context diagram representing the system and its external
   * entities.
   *
   * Must contain at least one node with `type: "system"`. Violation
   * triggers `MISSING_CONTEXT_DIAGRAM_SYSTEM` FAIL.
   */
  contextDiagram: AutoBeAnalyzeDocumentSystemOverview.ContextDiagram;

  /**
   * Stakeholder groups and their interests.
   *
   * At least one stakeholder is required because a system overview without
   * identified stakeholders cannot meaningfully guide downstream design
   * decisions.
   */
  stakeholders:
    & AutoBeAnalyzeDocumentSystemOverview.Stakeholder[]
    & tags.MinItems<1>;

  /**
   * Assumptions made during requirements elicitation.
   *
   * May be empty when no assumptions were identified.
   */
  assumptions: string[];

  /**
   * Constraints imposed by the business, technology, or regulations.
   *
   * May be empty when no external constraints apply.
   */
  constraints: string[];

  /**
   * Traceability link back to the evidence layer.
   *
   * MUST contain at least one sectionId. Validated as FAIL
   * (`EMPTY_SOURCE_SECTION_IDS`) if empty.
   */
  sourceSectionIds: string[] & tags.MinItems<1>;
}
export namespace AutoBeAnalyzeDocumentSystemOverview {
  /**
   * Structured context diagram as nodes and edges.
   *
   * Represents the system boundary and external entities in a graph
   * structure. No rendering logic — pure data.
   */
  export interface ContextDiagram {
    /**
     * Nodes in the context diagram.
     *
     * Must include at least one node (typically the system node itself).
     */
    nodes: ContextDiagramNode[] & tags.MinItems<1>;

    /**
     * Edges (data flows / interactions) between nodes.
     *
     * Every `from` and `to` value must reference an existing
     * {@link ContextDiagramNode.nodeId}. Dangling references trigger
     * `DANGLING_CONTEXT_EDGE` FAIL.
     */
    edges: ContextDiagramEdge[];
  }

  /**
   * A node in the context diagram.
   */
  export interface ContextDiagramNode {
    /**
     * Unique identifier for this node within the diagram.
     */
    nodeId: string & tags.MinLength<1>;

    /**
     * Human-readable label.
     */
    label: string;

    /**
     * Type of entity.
     *
     * - `"system"`: The system being specified (exactly one expected).
     * - `"externalSystem"`: Another software system.
     * - `"actor"`: A human or organizational role.
     * - `"dataStore"`: A database, file system, or persistent storage.
     */
    type: "system" | "externalSystem" | "actor" | "dataStore";

    /**
     * Optional description of the node's role.
     */
    description?: string;
  }

  /**
   * An edge representing data flow or interaction between two nodes.
   */
  export interface ContextDiagramEdge {
    /**
     * Source node ID. Must reference an existing
     * {@link ContextDiagramNode.nodeId}.
     */
    from: string;

    /**
     * Target node ID. Must reference an existing
     * {@link ContextDiagramNode.nodeId}.
     */
    to: string;

    /**
     * Label describing the data or interaction.
     */
    label: string;

    /**
     * Direction of the flow.
     */
    direction: "unidirectional" | "bidirectional";
  }

  /**
   * A stakeholder group with interests in the system.
   */
  export interface Stakeholder {
    /**
     * Stakeholder name or role.
     *
     * @example "End User", "System Administrator"
     */
    name: string;

    /**
     * Description of their interests and concerns.
     */
    interests: string;
  }
}
