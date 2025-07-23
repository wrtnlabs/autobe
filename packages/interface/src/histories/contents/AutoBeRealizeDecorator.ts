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

  export interface IDecoratorType {
    /**
     * The name of the Decorator to be generated in {Role}Auth format (e.g.,
     * AdminAuth, UserAuth). This decorator will be used as a parameter
     * decorator in Controller methods to automatically authenticate and
     * authorize users for the specific role, injecting the authenticated user
     * payload as a method parameter.
     */
    name: string;

    /**
     * The TypeScript code for the Payload type in {Role}Payload format (e.g.,
     * AdminPayload, UserPayload). This interface defines the structure of the
     * authenticated user data that will be injected into Controller methods
     * when using the decorator. It serves as the TypeScript type for the
     * parameter in Controller method signatures.
     */
    code: string;
  }
}
