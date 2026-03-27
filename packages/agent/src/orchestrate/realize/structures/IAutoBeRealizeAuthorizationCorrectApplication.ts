import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBeRealizeAuthorizationWriteApplication } from "./IAutoBeRealizeAuthorizationWriteApplication";

export interface IAutoBeRealizeAuthorizationCorrectApplication {
  /**
   * Process authentication correction task or preliminary data requests.
   *
   * @param next Request containing either preliminary data request or complete
   *   task
   */
  process(next: IAutoBeRealizeAuthorizationCorrectApplication.IProps): void;
}

export namespace IAutoBeRealizeAuthorizationCorrectApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * For preliminary requests: what critical information is missing?
     *
     * For completion: what did you acquire, what did you accomplish, why is it
     * sufficient?
     */
    thinking: string;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union, physically preventing repeated calls.
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
