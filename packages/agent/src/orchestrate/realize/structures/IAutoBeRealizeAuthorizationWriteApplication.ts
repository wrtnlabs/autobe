import { CamelCasePattern, PascalCasePattern } from "@autobe/interface";

import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";

export interface IAutoBeRealizeAuthorizationWriteApplication {
  /**
   * Process authentication component generation task or preliminary data
   * requests.
   *
   * Generates JWT-based authentication infrastructure (provider, decorator,
   * payload) for role-based authorization. Integrates with NestJS patterns and
   * jwtAuthorize utility.
   *
   * @param next Request containing either preliminary data request or complete
   *   task
   */
  process(next: IAutoBeRealizeAuthorizationWriteApplication.IProps): void;
}

export namespace IAutoBeRealizeAuthorizationWriteApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisFiles, getDatabaseSchemas, etc.):
     *
     * - What critical information is missing that you don't already have?
     * - Why do you need it specifically right now?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For completion (complete):
     *
     * - What key assets did you acquire?
     * - What did you accomplish?
     * - Why is it sufficient to complete?
     * - Summarize - don't enumerate every single item.
     *
     * This reflection helps you avoid duplicate requests and premature
     * completion.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getDatabaseSchemas) or final authentication generation (complete). When
     * preliminary returns empty array, that type is removed from the union,
     * physically preventing repeated calls.
     */
    request: IComplete | IAutoBePreliminaryGetDatabaseSchemas;
  }

  /**
   * Request to generate authentication components.
   *
   * Executes authentication generation to create provider function, decorator,
   * and payload type for the specified role. All components work together to
   * provide JWT-based authentication and authorization.
   */
  export interface IComplete {
    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval or actual
     * task execution. Value "complete" indicates this is the final task
     * execution request.
     */
    type: "complete";

    /**
     * Authentication Provider function configuration containing the function
     * name and implementation code. The Provider handles JWT token
     * verification, role validation, and database queries to authenticate
     * users.
     */
    provider: IAutoBeRealizeAuthorizationWriteApplication.IProvider;

    /**
     * Authentication Decorator configuration containing the decorator name and
     * implementation code. The Decorator integrates with NestJS parameter
     * decorators to automatically inject authenticated user data into
     * Controller methods.
     */
    decorator: IAutoBeRealizeAuthorizationWriteApplication.IDecorator;

    /**
     * Authentication Payload Type configuration containing the payload type
     * name and implementation code. The Payload Type is used to define the
     * structure of the authenticated user data that will be injected into
     * Controller methods when using the decorator. It serves as the TypeScript
     * type for the parameter in Controller method signatures.
     */
    payload: IAutoBeRealizeAuthorizationWriteApplication.IPayloadType;
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
    name: string & CamelCasePattern;

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
     * The name of the Decorator to be generated in {Actor}Auth format (e.g.,
     * AdminAuth, UserAuth). This decorator will be used as a parameter
     * decorator in Controller methods to automatically authenticate and
     * authorize users for the specific role, injecting the authenticated user
     * payload as a method parameter.
     *
     * DO: Use PascalCase naming convention.
     */
    name: string & PascalCasePattern;

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
     * The name of the Payload type to be generated in {Actor}Payload format
     * (e.g., AdminPayload, UserPayload). This type defines the structure of the
     * authenticated user data that will be injected into Controller methods
     * when using the decorator.
     *
     * DO: Use PascalCase naming convention.
     */
    name: string & PascalCasePattern;

    /**
     * Complete TypeScript code for the Payload type interface in {Actor}Payload
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
