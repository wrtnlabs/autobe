import { IAutoBeTokenUsageJson } from "../json/IAutoBeTokenUsageJson";
import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Interface agent creates the complete list of API
 * endpoints during the RESTful API design process.
 *
 * This event occurs early in the API design workflow, after the Interface agent
 * has analyzed the requirements and database schema to determine what API
 * endpoints are needed for the application. The endpoint creation establishes
 * the fundamental structure of the API surface area before detailed operation
 * definitions and schema components are developed.
 *
 * The endpoints list provides the architectural foundation for the API design,
 * ensuring comprehensive coverage of the business functionality while
 * maintaining RESTful principles and consistency with the underlying data
 * model.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceEndpointsEvent
  extends AutoBeEventBase<"interfaceEndpoints"> {
  /**
   * Array of API endpoints that have been defined for the application.
   *
   * Contains the complete list of {@link AutoBeOpenApi.IEndpoint} definitions
   * that establish the API surface area for the application. Each endpoint
   * represents a specific URL path and HTTP method combination that will be
   * available in the final API, covering all necessary business operations and
   * data access patterns.
   *
   * The endpoints are designed to provide comprehensive coverage of the
   * business functionality while following RESTful conventions and maintaining
   * consistency with the database schema. This foundational structure guides
   * the subsequent development of detailed operation specifications and schema
   * definitions.
   */
  endpoints: AutoBeOpenApi.IEndpoint[];

  /**
   * Number of API endpoints that have been created so far.
   *
   * Indicates the current progress in the endpoint creation process, showing
   * how many API endpoints have been successfully defined. This progress
   * tracking helps stakeholders monitor the advancement of the API design and
   * understand completion timing.
   */
  completed: number;

  /**
   * Total number of API endpoints that are planned to be created.
   *
   * This value represents the overall scope of the API design effort,
   * indicating how many endpoints are expected to be defined in total. It
   * serves as a benchmark for measuring progress and completion against the
   * initial design goals.
   */
  total: number;

  /**
   * Iteration number of the requirements analysis this endpoint creation was
   * performed for.
   *
   * Indicates which version of the requirements analysis this endpoint design
   * reflects. This step number ensures that the API endpoints are aligned with
   * the current requirements and helps track the evolution of the API surface
   * area as requirements change.
   *
   * The step value enables proper synchronization between endpoint definitions
   * and the underlying requirements, ensuring that the API structure remains
   * relevant to the current project scope and business objectives.
   */
  step: number;

  /**
   * Token usage statistics for the API endpoint creation process.
   *
   * Tracks the computational resources consumed by the Interface agent when
   * establishing the API surface area through endpoint definitions. This
   * metric provides insight into the complexity of translating business
   * requirements and database schemas into a comprehensive set of RESTful
   * API endpoints.
   *
   * The token usage correlates with the number and complexity of endpoints
   * being created, helping stakeholders understand the resource requirements
   * for different scales of API design efforts.
   */
  tokenUsage: IAutoBeTokenUsageJson.IComponent;
}
