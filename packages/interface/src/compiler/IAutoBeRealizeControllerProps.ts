import { AutoBeRealizeAuthorization } from "../histories";
import { AutoBeRealizeFunction } from "../histories/contents/AutoBeRealizeFunction";
import { AutoBeOpenApi } from "../openapi";

/**
 * Configuration properties for generating NestJS controller implementations.
 *
 * This interface defines the essential inputs required for the Realize compiler's
 * controller generation process, providing specifications for API endpoints,
 * business logic functions, and authorization mechanisms. The properties enable
 * the compiler to create fully-integrated controller classes that properly
 * orchestrate business logic execution with appropriate security controls.
 *
 * @author Samchon
 */
export interface IAutoBeRealizeControllerProps {
  /**
   * OpenAPI document containing API endpoint specifications and schemas.
   *
   * Provides comprehensive API contract definitions including endpoint paths,
   * HTTP methods, request/response schemas, and parameter specifications. This
   * document serves as the authoritative source for generating controller
   * methods that correctly handle API requests according to the defined
   * interface contracts.
   */
  document: AutoBeOpenApi.IDocument;

  /**
   * Array of business logic function implementations to be integrated.
   *
   * Contains function specifications including their names, file locations,
   * implementation content, role requirements, and endpoint mappings. These
   * functions represent the core business logic that controllers will delegate
   * to, ensuring proper separation of concerns between HTTP handling and
   * business logic execution.
   */
  functions: AutoBeRealizeFunction[];

  /**
   * Authorization configurations for role-based access control.
   *
   * Defines authorization mechanisms including decorator implementations,
   * payload interfaces for authenticated user contexts, and provider functions
   * for authorization validation. These configurations enable controllers to
   * enforce proper authentication and authorization requirements based on
   * endpoint role specifications.
   */
  authorizations: AutoBeRealizeAuthorization[];
}
