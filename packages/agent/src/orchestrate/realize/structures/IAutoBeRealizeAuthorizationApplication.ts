import { CamelPattern, PascalPattern } from "@autobe/interface";

export interface IAutoBeRealizeAuthorizationApplication {
  createDecorator: (
    next: IAutoBeRealizeAuthorizationApplication.IProps,
  ) => void;
}

export namespace IAutoBeRealizeAuthorizationApplication {
  export interface IProps {
    /**
     * Authentication Provider function configuration containing the function
     * name and implementation code. The Provider handles JWT token
     * verification, role validation, and database queries to authenticate
     * users.
     */
    provider: IAutoBeRealizeAuthorizationApplication.IProvider;

    /**
     * Authentication Decorator configuration containing the decorator name and
     * implementation code. The Decorator integrates with NestJS parameter
     * decorators to automatically inject authenticated user data into
     * Controller methods.
     */
    decorator: IAutoBeRealizeAuthorizationApplication.IDecorator;

    /**
     * Authentication Payload Type configuration containing the payload type
     * name and implementation code. The Payload Type is used to define the
     * structure of the authenticated user data that will be injected into
     * Controller methods when using the decorator. It serves as the TypeScript
     * type for the parameter in Controller method signatures.
     */
    payload: IAutoBeRealizeAuthorizationApplication.IPayloadType;
  }

  export interface IProvider {
    /**
     * The name of the authentication Provider function in {role}Authorize
     * format (e.g., adminAuthorize, userAuthorize). This function will be
     * called by the decorator to verify JWT tokens and return authenticated
     * user information for the specified role.
     *
     * DO: Use camelCase naming convention.
     */
    name: string & CamelPattern;

    /**
     * Complete TypeScript code for the authentication Provider function. Must
     * include: JWT token verification using jwtAuthorize function, role type
     * checking against payload.type, database query using
     * MyGlobal.prisma.{tableName} pattern to verify user existence, and proper
     * error handling with ForbiddenException and UnauthorizedException. The
     * function should return the authenticated user payload data.
     */
    content: string;
  }

  export interface IDecorator {
    /**
     * The name of the Decorator to be generated in {Role}Auth format (e.g.,
     * AdminAuth, UserAuth). This decorator will be used as a parameter
     * decorator in Controller methods to automatically authenticate and
     * authorize users for the specific role, injecting the authenticated user
     * payload as a method parameter.
     *
     * DO: Use PascalCase naming convention.
     */
    name: string & PascalPattern;

    /**
     * Complete TypeScript code for the authentication Decorator implementation.
     * Must include: SwaggerCustomizer integration to add bearer token security
     * schema to API documentation, createParamDecorator implementation that
     * calls the corresponding Provider function for authentication, Singleton
     * pattern using tstl library for efficient decorator instance management,
     * and proper TypeScript typing for the ParameterDecorator interface.
     */
    content: string;
  }

  export interface IPayloadType {
    /**
     * The name of the Payload type to be generated in {Role}Payload format
     * (e.g., AdminPayload, UserPayload). This type defines the structure of the
     * authenticated user data that will be injected into Controller methods
     * when using the decorator.
     *
     * DO: Use PascalCase naming convention.
     */
    name: string & PascalPattern;

    /**
     * Complete TypeScript code for the Payload type interface in {Role}Payload
     * format (e.g., AdminPayload, UserPayload). Must include: id field with
     * UUID format validation, type field as role discriminator, and proper
     * typia tags for validation. This interface defines the structure of the
     * authenticated user data that will be injected into Controller methods
     * when using the decorator and serves as the TypeScript type for the
     * parameter in Controller method signatures.
     */
    content: string;
  }
}
