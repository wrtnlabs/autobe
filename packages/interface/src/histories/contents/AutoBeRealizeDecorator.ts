import { AutoBeRealizeDecoratorPayload } from "./AutoBeRealizeDecoratorPayload";

export interface AutoBeRealizeDecorator {
  /**
   * The name of Decorator.
   *
   * The name of the Decorator to be generated in {Role}Auth format (e.g.,
   * AdminAuth, UserAuth). This decorator will be used as a parameter decorator
   * in Controller methods to automatically authenticate and authorize users for
   * the specific role, injecting the authenticated user payload as a method
   * parameter.
   */
  name: string;

  /**
   * The location of the Decorator.
   *
   * Specifies the file path or directory location where the decorator
   * implementation will be generated and stored. This location ensures proper
   * organization of authentication-related files within the project structure
   * and enables correct import statements when the decorator is used in
   * Controller classes.
   */
  location: string;

  /**
   * The role of Decorator.
   *
   * Indicates the specific role that this decorator will authenticate and
   * authorize. This role determines the access level and permissions that will
   * be validated when the decorator is applied to Controller methods, ensuring
   * that only users with the appropriate role can access protected endpoints.
   */
  role: string;

  /**
   * The payload type of the Decorator.
   *
   * Configuration object that defines the TypeScript type structure for the
   * authenticated user data that will be injected into Controller method
   * parameters. This payload type ensures type safety and provides the
   * necessary type information for the decorator to properly handle and
   * validate the authenticated user data during request processing.
   */
  payload: AutoBeRealizeDecoratorPayload;
}

export namespace AutoBeRealizeDecorator {
  export interface IProvider {
    /**
     * The name of the authentication Provider function in {role}Authorize
     * format (e.g., adminAuthorize, userAuthorize). This function will be
     * called by the decorator to verify JWT tokens and return authenticated
     * user information for the specified role.
     */
    name: string;

    /**
     * Complete TypeScript code for the authentication Provider function and its
     * corresponding Payload interface. Must include: JWT token verification
     * using jwtAuthorize function, role type checking against payload.type,
     * database query using MyGlobal.prisma.{tableName} pattern to verify user
     * existence, proper error handling with ForbiddenException and
     * UnauthorizedException, and the Payload interface definition with id (UUID
     * format) and type (role discriminator) fields using typia tags.
     */
    code: string;
  }

  export interface IDecorator {
    /**
     * The name of the Decorator to be generated in {Role}Auth format (e.g.,
     * AdminAuth, UserAuth). This decorator will be used as a parameter
     * decorator in Controller methods to automatically authenticate and
     * authorize users for the specific role, injecting the authenticated user
     * payload as a method parameter.
     */
    name: string;

    /**
     * Complete TypeScript code for the authentication Decorator implementation.
     * Must include: SwaggerCustomizer integration to add bearer token security
     * schema to API documentation, createParamDecorator implementation that
     * calls the corresponding Provider function for authentication, Singleton
     * pattern using tstl library for efficient decorator instance management,
     * and proper TypeScript typing for the ParameterDecorator interface.
     */
    code: string;
  }
}
