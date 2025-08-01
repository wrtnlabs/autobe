import { AutoBeAnalyzeRole } from "../histories/contents/AutoBeAnalyzeRole";
import { AutoBeEventBase } from "./AutoBeEventBase";

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
  extends AutoBeEventBase<"analyzeComplete"> {
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
  files: Record<string, string>;

  /**
   * List of roles identified during the requirements analysis process.
   *
   * Contains the various user roles, personas, or stakeholder types that were
   * identified and analyzed during the requirements gathering phase. These
   * roles help define different user perspectives, access levels, and
   * functional requirements needed for the system being developed.
   */
  roles: AutoBeAnalyzeRole[];

  /**
   * Final iteration number of the completed requirements analysis report.
   *
   * Indicates the final revision number of the requirements analysis that was
   * completed. A value of 0 means this is the initial requirements analysis,
   * while higher values represent the number of revisions that were made based
   * on user feedback or additional requirements gathering.
   *
   * This step number serves as a reference point for other development
   * artifacts, ensuring they are aligned with the latest requirements.
   * Development artifacts with lower step values may need regeneration to
   * reflect the completed analysis.
   */
  step: number;
}
