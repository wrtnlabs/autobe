import { AutoBeRealizeAuthorization } from "../histories/contents/AutoBeRealizeAuthorization";
import { IAutoBeTokenUsageJson } from "../json/IAutoBeTokenUsageJson";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Realize Authorization agent writes authorization-related
 * implementation files.
 *
 * This event represents the generation of authorization components including
 * decorators, providers, and payload interfaces that enable role-based access
 * control throughout the application. The event occurs during the authorization
 * implementation phase where security policies defined in the API specification
 * are transformed into working authorization code.
 *
 * The generated authorization files include custom decorators for endpoint
 * protection, payload interfaces for JWT token structure, and provider
 * functions that handle authorization logic validation and enforcement.
 *
 * @author Michael
 */
export interface AutoBeRealizeAuthorizationWriteEvent
  extends AutoBeEventBase<"realizeAuthorizationWrite"> {
  /**
   * Authorization implementation details being written.
   *
   * Contains the complete authorization component specification including the
   * role name, decorator implementation, payload interface, and provider
   * function. This object represents a single authorization component that will
   * be generated for a specific user role in the system.
   */
  authorization: AutoBeRealizeAuthorization;

  /**
   * Number of authorization components that have been completed so far.
   *
   * Indicates the current progress in the authorization implementation process,
   * showing how many authorization components (providers, payloads, decorators)
   * have been successfully generated for different user roles. This progress
   * tracking helps stakeholders monitor the advancement of the authentication
   * and authorization system implementation.
   */
  completed: number;

  /**
   * Total number of authorization components that need to be created.
   *
   * Represents the complete scope of authorization components required for all
   * user roles defined in the system. This total count provides context for the
   * completion progress and helps stakeholders understand the complexity of the
   * role-based access control system being implemented.
   */
  total: number;

  /**
   * Iteration number of the requirements analysis this authorization
   * implementation reflects.
   *
   * Indicates which version of the requirements analysis this authorization
   * work is based on. This step number ensures that the authorization
   * implementation is aligned with the current requirements and helps track the
   * development of access control components as they evolve with changing
   * business needs.
   *
   * The step value enables proper synchronization between authorization
   * implementation and the underlying requirements, ensuring that the generated
   * authentication and authorization code remains relevant to the current
   * project scope and security requirements.
   */
  step: number;

  /**
   * Token consumption metrics for generating authorization components.
   *
   * Tracks the AI model's token usage during the creation of authorization
   * infrastructure including decorators, providers, and payload interfaces.
   * This metric provides visibility into the AI resources required for
   * implementing role-based access control, helping optimize the generation
   * of security-critical components.
   *
   * The token usage encompasses understanding security requirements from the
   * API specification and generating comprehensive authorization code that
   * enforces access policies while maintaining type safety and runtime
   * validation.
   */
  tokenUsage: IAutoBeTokenUsageJson.IComponent;
}
