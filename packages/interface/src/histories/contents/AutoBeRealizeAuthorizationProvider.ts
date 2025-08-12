import { CamelPattern } from "../../typings/CamelPattern";

/**
 * Authorization provider implementation for runtime access control.
 *
 * This interface represents a NestJS provider that implements the core
 * authorization logic for the application. Providers include guards,
 * strategies, services, and other injectable classes that work together to
 * validate user permissions and enforce access control policies at runtime.
 *
 * Common provider types include:
 *
 * - Guards: Validate requests before reaching route handlers
 * - Strategies: Implement authentication protocols (JWT, OAuth, etc.)
 * - Services: Provide authorization business logic and user validation
 * - Middleware: Pre-process requests for authorization context
 *
 * @author Michael
 */
export interface AutoBeRealizeAuthorizationProvider {
  /**
   * The name of the authorization provider function (e.g., adminAuthorize,
   * userAuthorize).
   *
   * This identifier is used to create the function name in the generated code.
   * The name should follow TypeScript naming conventions and clearly indicate
   * the provider's purpose. For example, 'JwtAuthGuard' implements JWT token
   * validation, while 'RolesGuard' enforces role-based access control.
   */
  name: string & CamelPattern;

  /**
   * File path where the provider will be generated.
   *
   * Specifies the absolute path in the project structure where this provider
   * implementation will be written. The path typically follows patterns based
   * on the provider type:
   *
   * - Guards: 'src/auth/guards/{name}.guard.ts'
   * - Strategies: 'src/auth/strategies/{name}.strategy.ts'
   * - Services: 'src/auth/services/{name}.service.ts'
   */
  location: string;

  /**
   * Complete source code of the provider implementation.
   *
   * Contains the full TypeScript code for the provider class, including:
   *
   * - Import statements for NestJS decorators and dependencies
   * - Class decorator (@Injectable(), @Guard(), etc.)
   * - Constructor with dependency injection
   * - Implementation methods (canActivate, validate, etc.)
   * - Error handling and logging
   * - Integration with other authorization components
   *
   * The code is production-ready and follows NestJS best practices for provider
   * implementation and dependency injection.
   */
  content: string;
}
