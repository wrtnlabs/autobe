import { CamelCasePattern, PascalCasePattern } from "@autobe/interface";

import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";

/**
 * Generates authentication components (provider, decorator, payload) for an
 * actor type.
 */
export interface IAutoBeRealizeAuthorizationWriteApplication {
  /**
   * Process authentication generation task or preliminary data requests.
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
     * For preliminary requests: what database schemas are missing and why?
     *
     * For completion: what schemas did you acquire, what authentication
     * patterns did you implement, why is it sufficient?
     */
    thinking: string;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union, physically preventing repeated calls.
     */
    request: IComplete | IAutoBePreliminaryGetDatabaseSchemas;
  }

  /**
   * Request to generate authentication components (provider, decorator,
   * payload).
   */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /**
     * Authentication Provider function (JWT verification, role validation, DB
     * queries).
     */
    provider: IAutoBeRealizeAuthorizationWriteApplication.IProvider;

    /**
     * Authentication Decorator (NestJS parameter decorator injecting
     * authenticated user data).
     */
    decorator: IAutoBeRealizeAuthorizationWriteApplication.IDecorator;

    /**
     * Authentication Payload Type (TypeScript type for authenticated user data
     * in Controller methods).
     */
    payload: IAutoBeRealizeAuthorizationWriteApplication.IPayloadType;
  }

  export interface IProvider {
    /**
     * Provider function name in {role}Authorize format (e.g., adminAuthorize).
     * MUST use camelCase.
     */
    name: string & CamelCasePattern;

    /**
     * Complete TypeScript code. MUST include: jwtAuthorize call, role type
     * check, MyGlobal.prisma.{tableName} query,
     * ForbiddenException/UnauthorizedException handling.
     */
    content: string;
  }

  export interface IDecorator {
    /**
     * Decorator name in {Actor}Auth format (e.g., AdminAuth, UserAuth). MUST
     * use PascalCase.
     */
    name: string & PascalCasePattern;

    /**
     * Complete TypeScript code. MUST include: SwaggerCustomizer integration,
     * createParamDecorator calling Provider, Singleton pattern via tstl.
     */
    content: string;
  }

  export interface IPayloadType {
    /**
     * Payload type name in {Actor}Payload format (e.g., AdminPayload,
     * UserPayload). MUST use PascalCase.
     */
    name: string & PascalCasePattern;

    /**
     * Complete TypeScript code. MUST include: id field with UUID validation,
     * type field as role discriminator, typia tags.
     */
    content: string;
  }
}
