import { AutoBeAnalyzeFile } from "../histories/contents/AutoBeAnalyzeFile";
import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeProgressEventBase } from "./AutoBeProgressEventBase";
import { AutoBeTokenUsageEventBase } from "./AutoBeTokenUsageEventBase";

/**
 * Event fired during the writing phase of the requirements analysis process.
 *
 * This event represents the core activity of the Analyze Writer Agent
 * (PlannerAgent), which serves as AutoBE's requirements analysis specialist.
 * The agent transforms user requirements and business objectives into
 * comprehensive, developer-ready documentation following the WHY → WHAT → HOW
 * framework.
 *
 * The Analyze Writer Agent operates as the first critical step in AutoBE's
 * waterfall development model, producing structured markdown documents that
 * include:
 *
 * - Business models and user roles
 * - Functional requirements in EARS (Easy Approach to Requirements Syntax) format
 * - API endpoint specifications (as guidance, not prescriptive)
 * - Entity relationship diagrams (ERD)
 * - Security and business logic requirements
 *
 * Key characteristics of the writing process:
 *
 * - Focuses exclusively on backend requirements (no frontend/UI specifications)
 * - Produces documents ranging from 2,000 to 30,000+ characters
 * - Avoids ambiguous terms and maintains clear, measurable requirements
 * - Excludes implementation details to preserve developer autonomy
 *
 * The generated documents serve as the foundation for subsequent AutoBE agents:
 * Prisma Agent (database design), Interface Agent (API design), Test Agent
 * (test generation), and Realize Agent (implementation).
 *
 * For detailed information about the Analyze Writer Agent's behavior and
 * requirements, refer to packages/agent/prompts/ANALYZE_WRITE.md
 *
 * @author Kakasoo
 */
export interface AutoBeAnalyzeWriteEvent
  extends AutoBeEventBase<"analyzeWrite">,
    AutoBeProgressEventBase,
    AutoBeTokenUsageEventBase {
  /**
   * File structure and content being written by the Analyze Writer Agent.
   *
   * Contains the markdown document being generated, including all sections such
   * as overview, business model, functional requirements, API specifications,
   * and ERD diagrams. This file will be validated by the Analyze Review Agent
   * before proceeding to the next development phase.
   */
  file: AutoBeAnalyzeFile;

  /**
   * Current iteration number of the requirements analysis being written.
   *
   * Indicates which version of the requirements analysis is being drafted. This
   * step number provides context for understanding whether this is an initial
   * draft or a revision being written based on previous feedback or additional
   * requirements gathering.
   *
   * The step value helps track the iterative nature of requirements development
   * and correlates the writing activity with the overall requirements evolution
   * process throughout the project lifecycle.
   */
  step: number;
}
