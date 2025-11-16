import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";
import { IAutoBeRealizeAuthorizationWriteApplication } from "./IAutoBeRealizeAuthorizationWriteApplication";

export interface IAutoBeRealizeAuthorizationCorrectApplication {
  /**
   * Process authentication component correction task or preliminary data
   * requests.
   *
   * Fixes TypeScript compilation errors in authentication components through
   * systematic error diagnosis. Provides error analysis, solution guidance, and
   * corrected versions while preserving authentication logic.
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
     * Before requesting preliminary data or completing your task, reflect on your
     * current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisFiles, getPrismaSchemas, etc.):
     * - What critical information is missing that you don't already have?
     * - Why do you need it specifically right now?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For completion (complete):
     * - What key assets did you acquire?
     * - What did you accomplish?
     * - Why is it sufficient to complete?
     * - Summarize - don't enumerate every single item.
     *
     * This reflection helps you avoid duplicate requests and premature completion.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getPrismaSchemas) or final error correction (complete). When preliminary
     * returns empty array, that type is removed from the union, physically
     * preventing repeated calls.
     */
    request: IComplete | IAutoBePreliminaryGetPrismaSchemas;
  }

  /**
   * Request to fix authentication component errors.
   *
   * Executes targeted error correction to resolve TypeScript compilation issues
   * in provider, decorator, and payload type. Applies systematic fixes while
   * preserving all authentication logic and business requirements.
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
     * Step 1: TypeScript compilation error analysis and diagnosis.
     *
     * AI identifies and categorizes all compilation errors (type mismatches,
     * import issues, syntax errors) by component (providers/decorator/payload).
     * Lists specific error messages with their locations and types for
     * systematic troubleshooting.
     */
    error_analysis: string;

    /**
     * Step 2: Solution guidance and fix recommendations.
     *
     * AI provides clear, actionable instructions on how to resolve each
     * identified error. Includes specific steps like "add property X to
     * interface Y", "update import path from A to B", or "change type from C to
     * D". Focus on guidance rather than generating complete code
     * implementations.
     */
    solution_guidance: string;

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
}
