import { tags } from "typia";

import { AutoBeAnalyzeFile } from "../histories/contents/AutoBeAnalyzeFile";
import { AutoBeAnalyzeRole } from "../histories/contents/AutoBeAnalyzeRole";
import { IAutoBeTokenUsageJson } from "../json/IAutoBeTokenUsageJson";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event interface for analyze scenario composition operations in the AutoBE
 * system.
 *
 * This interface represents an event that orchestrates the creation of multiple
 * analysis documents as part of a comprehensive requirements analysis phase. It
 * enables the Analyze Agent to generate a series of interconnected planning
 * documents that collectively form a complete specification for backend
 * development.
 *
 * The scenario event follows the waterfall model approach, where each document
 * builds upon previous ones to create a logical flow of information from
 * high-level service overview to detailed technical specifications. This
 * systematic approach ensures that all aspects of the backend system are
 * thoroughly documented before any code generation begins.
 *
 * Key characteristics:
 *
 * - Supports multi-document analysis scenarios (minimum 1 document required)
 * - Maintains context between documents through the step tracking
 * - Defines user roles that will be used for authentication/authorization
 * - Uses prefix for consistent naming and organization of generated documents
 *
 * Typical usage flow:
 *
 * 1. Initial event creates overview and requirements documents (step 1-3)
 * 2. Subsequent events add user flows and technical specs (step 4-6)
 * 3. Final events complete with API specifications and data models (step 7+)
 *
 * @author Kakasoo
 */
export interface AutoBeAnalyzeScenarioEvent
  extends AutoBeEventBase<"analyzeScenario"> {
  /**
   * Prefix identifier for the analysis scenario.
   *
   * This prefix serves as a namespace for all documents generated within this
   * scenario, ensuring consistent organization and preventing naming conflicts.
   * It typically represents the project or service name and is used to:
   *
   * - Group related analysis documents together
   * - Create a consistent naming convention for generated files
   * - Identify the context for subsequent agent operations
   * - Enable parallel analysis of multiple services without conflicts
   *
   * Examples: "e-commerce", "social-media", "banking-system",
   * "logistics-platform"
   *
   * The prefix should be:
   *
   * - Lowercase with hyphens for multi-word names
   * - Descriptive enough to identify the service uniquely
   * - Consistent across all related events in the scenario
   */
  prefix: string;

  /**
   * Array of user roles that will interact with the backend system.
   *
   * These roles define the different types of authenticated users who will
   * access the system, each with their own permissions and capabilities. The
   * roles specified here directly influence:
   *
   * - Prisma schema generation (user models and role relationships)
   * - API endpoint authorization decorators
   * - Test scenario generation for different permission levels
   * - Business logic for role-based access control
   *
   * Common patterns:
   *
   * - Public systems: ["customer", "admin"]
   * - Marketplace: ["buyer", "seller", "admin", "support"]
   * - Enterprise: ["employee", "manager", "hr", "admin", "auditor"]
   * - Educational: ["student", "teacher", "parent", "admin"]
   *
   * Each role should have a clear, distinct purpose and non-overlapping
   * responsibilities to ensure clean authorization logic in the generated
   * code.
   */
  roles: AutoBeAnalyzeRole[];

  /**
   * Language for document content. When specified by the user, this takes
   * precedence over the locale setting for determining document language.
   */
  language?: string;

  /**
   * Array of document specifications to be generated in this scenario.
   *
   * This array defines the planning documents that the Analyze Agent will
   * create during this event. Each document serves a specific purpose in the
   * requirements analysis phase and contributes to the overall system
   * specification.
   *
   * Requirements:
   *
   * - Minimum of 1 document per event (enforced by tags.MinItems<1>)
   * - Documents should follow a logical progression
   * - Each document should build upon information from previous ones
   * - Later documents can reference earlier ones via relatedDocuments field
   *
   * Typical document progression:
   *
   * 1. Service Overview - High-level vision and goals
   * 2. Requirements - Functional and non-functional requirements
   * 3. User Stories - Detailed user personas and scenarios
   * 4. User Flows - Step-by-step interaction sequences
   * 5. Business Model - Revenue, costs, and value propositions
   * 6. API Specification - Detailed endpoint documentation
   * 7. Data Models - Database schema and relationships
   *
   * The array structure allows flexible composition of documents based on
   * project complexity and specific needs.
   */
  files: Array<AutoBeAnalyzeFile.Scenario> & tags.MinItems<1>;

  /**
   * Current step number in the multi-event analysis scenario.
   *
   * This field tracks the progression through a series of related analyze
   * events, allowing the system to maintain context and ensure proper document
   * sequencing. The step number is crucial for:
   *
   * - Maintaining document creation order
   * - Referencing previous documents in the scenario
   * - Determining when the analysis phase is complete
   * - Coordinating with other agents that depend on analysis results
   *
   * Step progression patterns:
   *
   * - Step 1-3: Foundation documents (overview, requirements, user stories)
   * - Step 4-6: Detailed specifications (user flows, business model,
   *   architecture)
   * - Step 7+: Technical documents (API specs, data models, integration guides)
   *
   * The step number should increment with each new event in the same scenario,
   * and agents use this to understand the current phase of analysis.
   */
  step: number;

  /**
   * Token usage metrics for the Analyze Scenario operation.
   *
   * Records the amount of tokens consumed during the scenario-based requirements
   * analysis. This includes tokens used for:
   * - Orchestrating multiple document generation strategies
   * - Creating comprehensive analysis plans across document series
   * - Maintaining context between related documents
   * - Generating role-based requirements and permissions
   * - Coordinating the overall analysis workflow
   *
   * The token usage is particularly important for scenario events as they often
   * involve complex multi-document generation requiring substantial AI resources.
   */
  tokenUsage: IAutoBeTokenUsageJson.IComponent;
}
