import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBeRealizeAuthorizationWriteApplication } from "./IAutoBeRealizeAuthorizationWriteApplication";

export interface IAutoBeRealizeAuthorizationCorrectApplication {
  /**
   * Process authentication correction task or preliminary data requests.
   *
   * Workflow:
   *
   * 1. Request preliminary context if needed (getDatabaseSchemas)
   * 2. Submit corrected components via `write` — can be called multiple times to
   *    refine corrections
   * 3. Confirm finalization via `complete` after you are satisfied with the
   *    submitted components
   *
   * @param props Request containing preliminary data request, write submission,
   *   or completion confirmation
   */
  process(props: IAutoBeRealizeAuthorizationCorrectApplication.IProps): void;
}

export namespace IAutoBeRealizeAuthorizationCorrectApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * For preliminary requests: what critical information is missing and why?
     * Be brief — state the gap, don't list everything you have.
     *
     * For write submissions: summarize what errors you are fixing and how. If
     * this is a revision, explain what changed from the previous submission.
     *
     * For completion: confirm that the last write submission is correct and
     * complete.
     */
    thinking: string;

    /**
     * Action to perform.
     *
     * - Preliminary `getDatabaseSchemas` is removed from the union once
     *   exhausted.
     * - `complete` is only available after at least one `write` submission.
     */
    request:
      | IWrite
      | IAutoBePreliminaryComplete
      | IAutoBePreliminaryGetDatabaseSchemas;
  }

  /**
   * Submit corrected authentication components.
   *
   * This is an intermediate step — you can submit multiple times to refine your
   * corrections. The last submitted components will be used when you call
   * `complete`.
   */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

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
