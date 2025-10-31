import { AutoBeAnalyzeActor } from "../histories/contents/AutoBeAnalyzeActor";
import { AutoBeAnalyzeFile } from "../histories/contents/AutoBeAnalyzeFile";
import { AutoBeCompleteEventBase } from "./base/AutoBeCompleteEventBase";

/**
 * Event fired when the Analyze agent completes the requirements analysis
 * process and finalizes the comprehensive analysis report.
 *
 * This event represents the successful completion of the requirements analysis
 * workflow, which includes drafting, reviewing, amending, and finalizing the
 * analysis documentation. The event indicates that all discussions regarding
 * requirements have been completed and a comprehensive report has been issued
 * that will serve as the foundation for subsequent development phases.
 *
 * The completion of requirements analysis marks a critical milestone in the
 * vibe coding pipeline, as the generated report guides all subsequent
 * development activities including database design, API specification, and
 * implementation.
 *
 * @author Kakasoo
 */
export interface AutoBeAnalyzeCompleteEvent
  extends AutoBeCompleteEventBase<"analyzeComplete"> {
  /**
   * Project alias prefix that will be applied to all generated artifacts.
   *
   * A short project identifier that will be consistently used as a prefix for
   * database table names, API function names, and DTO type names throughout the
   * entire codebase. This ensures consistent naming conventions and helps avoid
   * naming conflicts in larger systems.
   *
   * For example, if the prefix is "shopping", generated artifacts might include
   * tables like "shopping_customers" and DTOs like "ShoppingCustomerDto".
   */
  prefix: string;

  /**
   * List of actors identified during the requirements analysis process.
   *
   * Contains the various user actors, personas, or stakeholder types that were
   * identified and analyzed during the requirements gathering phase. These
   * actors help define different user perspectives, access levels, and
   * functional requirements needed for the system being developed.
   */
  actors: AutoBeAnalyzeActor[];

  /**
   * Generated requirements analysis report files as key-value pairs.
   *
   * Contains the complete set of markdown documents that comprise the finalized
   * requirements analysis report. Each key represents the filename and each
   * value contains the actual markdown content. The report typically includes
   * business context, functional requirements, technical specifications,
   * architectural decisions, and implementation guidelines.
   *
   * These documents serve as the authoritative source for understanding project
   * requirements and guide all subsequent development phases in the vibe coding
   * pipeline including database design, API specification, and implementation.
   */
  files: AutoBeAnalyzeFile[];
}
