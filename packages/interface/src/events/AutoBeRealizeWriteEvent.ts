import { IAutoBeTokenUsageJson } from "../json/IAutoBeTokenUsageJson";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired during the implementation process as the Realize agent creates
 * individual implementation files.
 *
 * This event provides real-time visibility into the implementation progress as
 * the Realize agent systematically creates service classes, business logic
 * methods, data access objects, and integration code. Each progress event
 * represents the completion of a specific implementation file that contributes
 * to the overall application functionality.
 *
 * The progress events enable stakeholders to monitor the final development
 * phase and understand how the complete application is being assembled from
 * individual implementation components that bridge API specifications with
 * database schemas.
 *
 * @author Samchon
 */
export interface AutoBeRealizeWriteEvent
  extends AutoBeEventBase<"realizeWrite"> {
  /**
   * Name of the implementation file that has been completed.
   *
   * Specifies the filename of the TypeScript implementation file that was just
   * generated, which could be a service class, business logic module, data
   * access object, integration handler, or other implementation component. The
   * filename provides context about which part of the application functionality
   * has been implemented.
   */
  location: string;

  /**
   * Content of the completed implementation file.
   *
   * Contains the actual TypeScript implementation code that was generated for
   * this file, including service methods, business logic, data access patterns,
   * error handling, and integration logic. The content represents working code
   * that implements the business requirements while maintaining consistency
   * with the established API contracts and database schemas.
   *
   * This implementation code bridges the gap between design specifications and
   * executable functionality, providing the concrete business logic that makes
   * the application operational and ready for deployment.
   */
  content: string;

  /**
   * Number of implementation files that have been completed so far.
   *
   * Indicates the current progress in the implementation process, showing how
   * many implementation files have been successfully generated and integrated
   * into the application. This progress tracking helps stakeholders monitor the
   * advancement of the final development phase and estimate completion timing.
   */
  completed: number;

  /**
   * Total number of implementation files that need to be created.
   *
   * Represents the complete scope of implementation files required to fulfill
   * all business requirements and complete the application functionality. This
   * total count provides context for the completion progress and helps
   * stakeholders understand the overall complexity and scope of the
   * implementation work.
   */
  total: number;

  /**
   * Iteration number of the requirements analysis this implementation progress
   * reflects.
   *
   * Indicates which version of the requirements analysis this implementation
   * work is based on. This step number ensures that the implementation progress
   * is aligned with the current requirements and helps track the development of
   * implementation components as they evolve with changing business needs.
   *
   * The step value enables proper synchronization between implementation
   * activities and the underlying requirements, ensuring that the generated
   * code remains relevant to the current project scope and business
   * objectives.
   */
  step: number;

  /**
   * Token consumption metrics for generating this implementation file.
   *
   * Tracks the AI model's token usage (input and output) during the generation
   * of this specific implementation file. This granular tracking enables precise
   * cost analysis and optimization of the Realize agent's implementation
   * process, helping identify which types of implementation files require more
   * AI processing resources.
   *
   * The metrics include tokens consumed for understanding the API specifications
   * and database schemas, as well as tokens generated for producing the complete
   * implementation code including service methods, business logic, and
   * integration patterns.
   */
  tokenUsage: IAutoBeTokenUsageJson.IComponent;
}
