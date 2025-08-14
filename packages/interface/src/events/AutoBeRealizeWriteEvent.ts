import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeProgressEventBase } from "./AutoBeProgressEventBase";
import { AutoBeTokenUsageEventBase } from "./AutoBeTokenUsageEventBase";

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
  extends AutoBeEventBase<"realizeWrite">,
    AutoBeProgressEventBase,
    AutoBeTokenUsageEventBase {
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
}
