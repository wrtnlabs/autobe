import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBeRealizeAuthorizationWriteApplication } from "./IAutoBeRealizeAuthorizationWriteApplication";

export interface IAutoBeRealizeAuthorizationCorrectApplication {
  /** Process task or retrieve preliminary data. */
  process(next: IAutoBeRealizeAuthorizationCorrectApplication.IProps): void;
}

export namespace IAutoBeRealizeAuthorizationCorrectApplication {
  export interface IProps {
    /**
     * Reasoning about your current state: what's missing (preliminary) or what
     * you accomplished (completion).
     */
    thinking: string;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union.
     */
    request: IComplete | IAutoBePreliminaryGetDatabaseSchemas;
  }

  /** Request to fix authentication component compilation errors. */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /**
     * Categorize all compilation errors by component
     * (provider/decorator/payload) with locations.
     */
    error_analysis: string;

    /** Actionable fix instructions for each identified error. */
    solution_guidance: string;

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
}
