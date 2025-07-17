import { tags } from "typia";

import { AutoBeAnalyzeRole } from "../../../agent/src/orchestrate/analyze/AutoBeAnalyzeRole";
import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

/**
 * History record generated when the Analyze agent and user have completed all
 * discussions regarding requirements, and a comprehensive analysis report has
 * been issued.
 *
 * The Analyze agent follows a structured workflow from initial drafting to
 * final completion, producing multiple markdown documents that capture business
 * requirements, technical specifications, and architectural decisions. This
 * analysis serves as the foundation for all subsequent development phases
 * including database design and API specification.
 *
 * The requirements analysis process transforms user conversations and business
 * needs into structured documentation that guides the entire vibe coding
 * pipeline, ensuring that technical implementation accurately reflects business
 * intentions.
 *
 * @author Samchon
 */
export interface AutoBeAnalyzeHistory
  extends AutoBeAgentHistoryBase<"analyze"> {
  /**
   * Reason why the Analyze agent was activated through function calling.
   *
   * Explains the specific circumstances that triggered the AI chatbot to invoke
   * the Analyze agent via function calling. This could include reasons such as
   * initial project requirements gathering, requests for requirement
   * clarification, updates to existing requirements based on user feedback, or
   * revision requests for the analysis report.
   */
  reason: string;

  /**
   * Iteration number of this requirements analysis report.
   *
   * Indicates which revision of the requirements analysis this represents. A
   * value of 0 means this is the initial requirements analysis, while higher
   * values represent subsequent revisions based on user feedback or additional
   * requirements gathering.
   *
   * If other development artifacts (Prisma, Interface, Test histories) have
   * step values lower than this value, it means those artifacts have not been
   * updated to reflect the latest requirements and may need regeneration.
   */
  step: number;

  /**
   * Project alias prefix that will be applied to all generated artifacts.
   *
   * A short project identifier that will be consistently used as a prefix for
   * database table names, API function names, and DTO type names throughout the
   * entire codebase. This ensures consistent naming conventions and helps avoid
   * naming conflicts in larger systems.
   *
   * For example, if the prefix is "shopping", generated artifacts might include
   * tables like `shopping_customers` and DTOs like `IShoppingCartCommodity`.
   */
  prefix: string;

  /**
   * Generated requirements analysis report files as key-value pairs.
   *
   * Contains the complete set of markdown documents that comprise the
   * requirements analysis report. Each key represents the filename and each
   * value contains the actual markdown content. The report typically includes
   * business context, functional requirements, technical specifications,
   * architectural decisions, and implementation guidelines.
   *
   * These documents serve as the authoritative source for understanding project
   * requirements and guide all subsequent development phases in the vibe coding
   * pipeline.
   */
  files: Record<string, string>;

  /**
   * ISO 8601 timestamp indicating when the requirements analysis was completed.
   *
   * Marks the exact moment when the Analyze agent finished the complete
   * analysis workflow including drafting, review, amendments, and finalization.
   * This timestamp is crucial for tracking the development timeline and
   * determining which development artifacts need updating based on requirement
   * changes.
   */
  completed_at: string & tags.Format<"date-time">;

  /**
   * List of roles identified during the requirements analysis process.
   *
   * Contains the various user roles, personas, or stakeholder types that were
   * identified and analyzed during the requirements gathering phase. These
   * roles help define different user perspectives, access levels, and
   * functional requirements needed for the system being developed.
   */
  roles: AutoBeAnalyzeRole[];
}
